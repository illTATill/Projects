import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { uploadFileListType, MessagesType } from './chat';
import { Response } from 'express';
import { Fileanagement } from '../fileanagement/fileanagement.schema';
import { FileanagementService } from '../fileanagement/fileanagement.service';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { ChatData } from './chat.schema';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { medAssistantDataPrompt } from './roleDefinition';
import { toolsData } from './tools';
// 创建请求对话的终止控制器
const controllerMap = new Map<string, AbortController>();
import { MyLogger } from '../../utils/no-timestamp-logger';
import { readFileSync } from 'fs';

@Injectable()
export class ChatService {
  private openai: OpenAI;
  private readonly logger = new MyLogger(); //初始化·
  constructor(
    @InjectModel(Fileanagement.name)
    private fileanagementModel: Model<Fileanagement>,

    @InjectRedis()
    private readonly redis: Redis,

    @InjectModel(ChatData.name)
    private chatDataModel: Model<ChatData>,

    private configService: ConfigService,
    private fileanagementService: FileanagementService,
  ) {
    // 通义千问
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('TONGYI_AKI_KEY') as string,
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    });
  }
  // 通知流
  notifStream(stream: Response, streamData: any) {
    // 用于将数据分块（chunk）写入到响应体中)
    stream.write(JSON.stringify(streamData) + '###ABC###'); //###ABC###用于前端处理重叠
  }
  // 根据文档id查询文件管理数据库
  async queryFile(userId: Types.ObjectId, docId: Types.ObjectId[]) {
    const fileData = await this.fileanagementModel
      .find({
        userId,
        _id: { $in: docId },
      })
      .select('fileText fileName fileSize fileType');
    return {
      uploadFileList: fileData.map((item) => ({
        fileName: item.fileName,
        fileSize: item.fileSize,
        fileType: item.fileType,
        docId: item._id.toString(),
      })),
      documents: fileData.map((item) => item.fileText),
    };
  }
  // 发送给模型之前需要整合对话结构
  async combineConvo(
    userId: Types.ObjectId, //用户id
    sessionId: Types.ObjectId | 'null', //会话id
    content: string, //用户的问题
    uploadFileList: uploadFileListType[] | undefined, //上传的文件列表
    stream: Response, //流式响应对象
    isKnowledgeBased: boolean | undefined, //是否根据知识库回答
    uploadImageList: MessagesType['uploadImageList'] | undefined, //携带的图片对象
  ) {
    // 组合对话字段：用户发送给模型的对话字段类型
    const messages: MessagesType = {
      role: 'user',
      content,
    };
    // 阅读的文件列表：最后需要交给大模型的回复里
    let readFileList: MessagesType['readFileData'] | undefined;
    // 判断用户是否携带文档
    if (uploadFileList && uploadFileList.length > 0) {
      // 如果用户上传文档，禁用知识库回答
      isKnowledgeBased = false;
      // 正在阅读文档
      this.notifStream(stream, {
        type: 'readDocument',
        statusInfo: 'inProgress',
        promptInfo: '正在阅读文档',
        fileList: [],
      });
      // 根据文档id查询文档内容
      const docIdArr = uploadFileList.map((item) => item.docId); //['xx','xxx']
      const docId = docIdArr.map((id) => new Types.ObjectId(id));
      const res = await this.queryFile(userId, docId);
      // 拼接文档内容：交给大模型
      const documentContent = res.documents.join('\n\n---\n\n');
      messages.content = `用户上传的文档内容如下:\n${documentContent}\n请基于文档内容回复用户问题:${content}`;
      // 取出原始问题
      messages.displayContent = content;
      // 取出文件列表数据
      messages.uploadFileList = res.uploadFileList;
      // 阅读的文件列表：最后需要交给大模型的回复里
      readFileList = {
        type: 'readDocument',
        statusInfo: 'completed',
        promptInfo: '文档阅读完毕',
        fileList: res.uploadFileList.map((item) => item.fileName),
      };
    }
    // 如果用户携带图片
    if (uploadImageList && Object.keys(uploadImageList).length > 0) {
      // 禁用知识库回答
      isKnowledgeBased = false;
      messages.uploadImageList = uploadImageList;
    }
    // ---------------------请求数据库：获取历史对话，组合上下文，让模型有记忆能力-----------
    // 需要发送的模型的对话列表：历史对话+当前对话
    let historyConvoList: MessagesType[] = [];
    // 判断是否初次对话，新创建对话
    if (sessionId === 'null') {
      historyConvoList.push(messages);
    } else {
      // 查询redis是否有对话记录，有就使用redis，否则使用mongodb
      const redisKey = `chat_history:${userId}:${sessionId}`;
      const cachedData = await this.redis.get(redisKey);
      if (cachedData) {
        // redis里对话数据，那就直接取出来
        historyConvoList = JSON.parse(cachedData);
      } else {
        // redis没有数据，那就从mongodb取数据
        const chatData = await this.chatDataModel.find({
          userId,
          _id: sessionId,
        });
        historyConvoList = chatData[0].chatList || [];
        // 存储进redis,3个小时过期
        await this.redis.set(
          redisKey,
          JSON.stringify(historyConvoList),
          'EX',
          10800,
        );
      }
      // 把当前用户的问题加入历史对话的最后一项
      historyConvoList.push(messages);
    }
    // 调用模型
    // console.log('对话数据');
    // console.log(JSON.stringify(historyConvoList));
    this.modelResult(
      historyConvoList.splice(-21), //取最近的21条对话数据
      userId.toString(),
      stream,
      sessionId,
      readFileList,
      uploadFileList,
      isKnowledgeBased,
      uploadImageList,
    );
  }
  // 调用模型：纯文本问答的模型
  async callingModel(
    messageList: MessagesType[],
    isKnowledgeBased?: boolean,
    controller?: AbortController,
  ) {
    const res = await this.openai.chat.completions.create(
      {
        model: 'qwen-plus',
        messages: [
          { role: 'system', content: medAssistantDataPrompt },
          ...messageList,
        ],
        stream: true,
        tools: toolsData,
        tool_choice: isKnowledgeBased
          ? { type: 'function', function: { name: 'H300' } }
          : 'none',
      },
      { signal: controller?.signal }, //中断模型输出
    );
    return res;
  }
  // 调用模型：多模态模型，图片理解
  async modelVlRes(
    messageList: MessagesType[],
    imageUrlObj: any,
    controller?: AbortController,
  ) {
    const res = await this.openai.chat.completions.create(
      {
        model: 'qwen-vl-max-latest',
        messages: [
          { role: 'system', content: '' },
          {
            role: 'user',
            content: [
              imageUrlObj,
              {
                type: 'text',
                text: messageList[messageList.length - 1].content,
              },
            ],
          },
        ],
        stream: true,
      },
      { signal: controller?.signal }, //中断模型输出
    );
    return res;
  }
  // 模型输出结果
  async modelResult(
    messageList: MessagesType[],
    userId: string,
    stream: Response,
    sessionId: Types.ObjectId | 'null' | undefined,
    readFileList: MessagesType['readFileData'] | undefined,
    uploadFileList: uploadFileListType[] | undefined,
    isKnowledgeBased: boolean | undefined,
    uploadFileImage: MessagesType['uploadImageList'] | undefined, //携带的图片对象
  ) {
    const controller = new AbortController();
    // sessionId && sessionId !== 'null' ? sessionId.toString() : 'null' + 'abc';
    const userSessionId = sessionId ? sessionId.toString() : 'null';
    console.log('调用模型传入了会话id' + userSessionId);
    controllerMap.set(userSessionId, controller);
    try {
      // 存储模型返回的结果
      let res;
      // 判断是否调用多模态大模型
      if (uploadFileImage && Object.keys(uploadFileImage).length > 0) {
        // 转换的base64图片取过来
        const imageUrlObj = this.encodeImage(
          uploadFileImage.imagePath,
          uploadFileImage.mimetype,
        );
        res = await this.modelVlRes(messageList, imageUrlObj, controller);
      } else {
        res = await this.callingModel(
          messageList,
          isKnowledgeBased,
          controller,
        );
      }
      // 如果用户携带文档对话，在这里返回前端
      if (uploadFileList && uploadFileList.length > 0) {
        this.notifStream(stream, readFileList);
      }
      // 存放拼接的新问题
      let toolCallArgsStr = '';
      // 标记工具是否开始调用
      let isToolCallStarted = false;
      // 模型回复的完整内容
      let assistantMessage = '';
      // 迭代
      if (!res) return false;
      for await (const chunk of res) {
        console.log('模型输出----------');
        const chunObj = chunk.choices[0].delta;
        // console.log(JSON.stringify(chunk));
        // 判断用户是否选择知识库回答，也就是触发工具调用
        if (chunObj.tool_calls && chunObj.tool_calls[0].function?.arguments) {
          toolCallArgsStr += chunObj.tool_calls[0].function.arguments;
          isToolCallStarted = true;
        }
        // 判断工具回复结束，处理新问题
        if (chunk.choices[0].finish_reason === 'stop' && isToolCallStarted) {
          // 取出新问题
          const newQuestion = JSON.parse(toolCallArgsStr) as {
            clarified_question: string;
          };
          if (
            newQuestion &&
            typeof newQuestion === 'object' &&
            'clarified_question' in newQuestion &&
            newQuestion.clarified_question.trim() !== ''
          ) {
            console.log(
              '工具生成了新问题-------' + newQuestion.clarified_question,
            );
            // 整理新的问题，查询知识库
            const res = await this.queryKb(
              stream,
              newQuestion.clarified_question,
              userId,
              messageList,
              readFileList,
              controller,
            );
            assistantMessage = res.assistantMessage;
            readFileList = res.readFileList;
          } else {
            // 工具没有生成新问题
            console.log('工具没有生成新问题---------');
            const lastItem = messageList[messageList.length - 1];
            const res = await this.queryKb(
              stream,
              lastItem.content,
              userId,
              messageList,
              readFileList,
              controller,
            );
            assistantMessage = res.assistantMessage;
            readFileList = res.readFileList;
          }
        }
        // 用户没有选择知识库按钮
        if (chunObj.content) {
          // console.log('用户没有选择知识库按钮--------');
          const returnRes = {
            role: 'assistant',
            content: chunk.choices[0].delta.content,
          };
          this.notifStream(stream, returnRes);
          // 合并模型消息
          assistantMessage += chunk.choices[0].delta.content || '';
        }
      }
      // ----------------------存储对话记录到数据库------------------
      // 模型回复的数据结构
      const assistantMessageObj: MessagesType = {
        role: 'assistant',
        content: assistantMessage,
        ...(readFileList && { readFileData: readFileList }),
      };
      //整理一轮新的对话，
      const convoPair: MessagesType[] = [
        messageList[messageList.length - 1],
        assistantMessageObj,
      ];
      // 存储数据库
      if (sessionId == 'null') {
        // 新创建的对话
        const newChat = await this.chatDataModel.create({
          userId,
          chatList: convoPair,
        });
        // ---同步更新redis
        const redisKey = `chat_history:${userId}:${newChat._id}`;
        await this.redis.set(redisKey, JSON.stringify(convoPair), 'EX', 10800);
        // 返回会话id给前端
        this.notifStream(stream, {
          role: 'sessionId',
          content: newChat._id,
          modelPrompt: '新会话已创建，请保存会话id',
        });
      } else {
        // 不是新对话，是在历史对话上接着询问的
        await this.chatDataModel.updateOne(
          { userId, _id: sessionId },
          { $push: { chatList: { $each: convoPair } } },
        );
        // ---同步更新redis
        const redisKey = `chat_history:${userId}:${sessionId}`;
        const cachedData = (await this.redis.get(redisKey)) as string;
        const parsedHistory: MessagesType[] = JSON.parse(cachedData);
        const updatedHistory = [...parsedHistory, ...convoPair];
        await this.redis.set(
          redisKey,
          JSON.stringify(updatedHistory),
          'EX',
          10800,
        );
      }
    } catch (error) {
      console.log('调用模型出错');
      console.log(error);
      this.logger.error('模型回复出错' + error);
      this.notifStream(stream, {
        role: 'error',
        content: error,
        modelPrompt: '模型回复出错',
      });
    } finally {
      // 告知前端通知流结束
      console.log('模型回复完毕');
      stream.end();
      controllerMap.delete(userSessionId);
    }
  }
  // 根据用户问题，检索知识库
  async queryKb(
    stream: Response,
    userQuestion: string,
    userId: string,
    messageList: MessagesType[],
    readFileList: MessagesType['readFileData'] | undefined,
    controller: AbortController,
  ) {
    // 告知前端用户正在检索知识库
    this.notifStream(stream, {
      type: 'queryKB',
      statusInfo: 'inProgress',
      promptInfo: '正在检索知识库',
      fileList: [],
    });
    // 将用户问题转换为向量
    const vectorUserQuestion = await this.fileanagementService.embeddingsAliyun(
      [{ pageContent: userQuestion }],
    );
    // 查询向量数据库
    const searchResults = await this.fileanagementService.searchDatabase(
      userId,
      userQuestion,
      vectorUserQuestion[0].embedding,
    );
    // 取最后一项对话
    const lastItem = messageList[messageList.length - 1];
    // 用户原始问题
    lastItem['displayContent'] = lastItem.content;
    // 用户问题和文档内容
    lastItem.content = searchResults.searchDocText;
    // 告知前端用户知识库检索完毕
    readFileList = {
      type: 'queryKB',
      statusInfo: 'completed',
      promptInfo: `为你检索到${searchResults.searchDocTitle.length}篇知识库`,
      fileList: searchResults.searchDocTitle,
    };
    this.notifStream(stream, readFileList);
    // 模型回复的完成内容
    let assistantMessage = '';
    // 再次调用模型回复用户
    const res2 = await this.callingModel(messageList, false, controller);
    for await (const chunk2 of res2) {
      const returnRes = {
        role: 'assistant',
        content: chunk2.choices[0].delta.content,
      };
      this.notifStream(stream, returnRes);
      // 合并模型消息
      assistantMessage += chunk2.choices[0].delta.content || '';
    }
    return {
      assistantMessage,
      readFileList,
    };
  }
  // 获取对话列表
  async getChatList(userId: string) {
    const res = await this.chatDataModel.aggregate([
      { $match: { userId } },
      {
        $project: {
          sessionId: '$_id',
          _id: 0,
          createTime: 1,
          chatList: {
            $map: {
              input: { $slice: ['$chatList', 1] },
              as: 'item',
              in: {
                content: {
                  $ifNull: ['$$item.displayContent', '$$item.content'],
                },
              },
            },
          },
        },
      },
      { $sort: { createTime: -1 } },
      { $unwind: '$chatList' },
      {
        $project: {
          sessionId: 1,
          content: '$chatList.content',
        },
      },
    ]);
    return { result: res, message: 'SUCCESS' };
  }
  // 获取某个会话的对话数据
  async singleChatData(userId: string, sessionId: string) {
    // 存储要返回的对话数据
    let singleChatData: MessagesType[] = [];
    // 先查询redis是否有
    const redisKey = `chat_history:${userId}:${sessionId}`;
    const cachedData = await this.redis.get(redisKey);
    if (cachedData) {
      singleChatData = JSON.parse(cachedData);
    } else {
      // 从mongodb请求
      const chatData = await this.chatDataModel.find({
        userId,
        _id: sessionId,
      });
      singleChatData = chatData[0].chatList;
      await this.redis.set(
        redisKey,
        JSON.stringify(singleChatData),
        'EX',
        10800,
      );
    }
    return { result: singleChatData, message: 'SUCCESS' };
  }
  // 终止模型输出
  stopOutput(sessionId: string) {
    const controller = controllerMap.get(sessionId);
    if (controller) {
      controller.abort(); //停止生成
      controllerMap.delete(sessionId);
      return { result: [], message: '会话已经终止' };
    } else {
      return { result: [], message: '会话没有找到，停止生成失败' };
    }
  }
  // 删除指定对话
  async deleteChat(sessionId: string, userId: string) {
    await this.chatDataModel.deleteMany({ _id: sessionId, userId });
    return { result: [], message: '删除成功' };
  }
  // 将图片转换base64编码，再交给多模态大模型
  encodeImage(imagePath: string, mimetype: string) {
    const imageFile = readFileSync(imagePath);
    const base64Image = imageFile.toString('base64');
    return {
      type: 'image_url',
      image_url: { url: `data:${mimetype};base64,${base64Image}` },
    };
  }
}
