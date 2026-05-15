import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { InjectModel } from '@nestjs/mongoose';
import { Fileanagement } from './fileanagement.schema';
import { Model, Types } from 'mongoose';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileanagementService } from './fileanagement.service';
import { DeletefileDto, DeleteImageDto } from './fileanagement.dto';
import { ConfigService } from '@nestjs/config';

// 处理上传的文件
const uploadFileInterceptor = FileFieldsInterceptor(
  [{ name: 'file', maxCount: 3 }],
  {
    // 使用本地存储方式上传文件
    storage: diskStorage({
      destination: './uploads', //文件存储的目录
      filename: (req, file, cb) => {
        // 对文件重新命名
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    }),
    // 文件过滤
    fileFilter: (req, file, cb) => {
      // 允许上传的文件类型
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new BadRequestException('只能上传 PDF 或 DOCX 文件'), false);
      }
      cb(null, true);
    },
    // 文件大小限制
    limits: { fileSize: 5 * 1024 * 1024 },
  },
);

// 处理上传的图片
const uploadFileImage = FileFieldsInterceptor([{ name: 'file', maxCount: 1 }], {
  // 使用本地存储方式上传文件
  storage: diskStorage({
    destination: './uploads-image', //文件存储的目录
    filename: (req, file, cb) => {
      // 对文件重新命名
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  }),
  // 文件过滤
  fileFilter: (req, file, cb) => {
    // 允许上传的文件类型
    const allowedTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new BadRequestException('只支持上传jpg,jpeg,png,webp格式的文件'),
        false,
      );
    }
    cb(null, true);
  },
  // 文件大小限制
  limits: { fileSize: 10 * 1024 * 1024 },
});

@Controller('fileanagement')
export class FileanagementController {
  constructor(
    @InjectModel(Fileanagement.name)
    private readonly fileanagementModel: Model<Fileanagement>,
    private readonly fileanagementService: FileanagementService,
    private configService: ConfigService,
  ) {}
  // 上传文件（知识库）
  @Post('uploadkb')
  @UseGuards(AuthGuard)
  @UseInterceptors(uploadFileInterceptor)
  async uploadFile(
    @Req() req: { user: { token: string } },
    @UploadedFiles() files: { file: Express.Multer.File[] },
    @Body() body: { wxoriginalname: string },
  ) {
    const userId = req.user.token;
    const wxnames = body.wxoriginalname || '';
    console.log('原文件名', wxnames);
    // 存储返回给前端的文档id
    const documentId: Types.ObjectId[] = [];
    // 处理上传的文档(for遍历处理多文件，推荐使用队列处理)
    // 处理标题编码问题
    const fixedFiles = (files.file || []).map((item) => ({
      ...item,
      originalname: wxnames != '' ? wxnames : this.fixOriginalName(item),
    }));
    for (const file of fixedFiles || []) {
      // 1.读取文档
      const { mergeTexts, splitDocument } =
        await this.fileanagementService.readFile(file, 'UB');
      // 2.上传数据库
      const docId = await this.fileanagementService.uploadFile(
        file,
        userId,
        mergeTexts,
        'UB',
      );
      // 3.向量，存储向量数据库
      const originalname = await this.fileanagementService.vectorStorage(
        file,
        splitDocument,
        userId,
        docId,
      );
      console.log(originalname);
      documentId.push(docId);
    }
    console.log('全部上传完毕');
    return { result: documentId, message: 'SUCCESS' };
  }
  // 删除知识库指定文件
  @Post('deletefilekb')
  @UseGuards(AuthGuard)
  async deleteFileKb(
    @Req() req: { user: { token: string } },
    @Body() body: DeletefileDto,
  ) {
    const { docId } = body;
    const userId = req.user.token;
    return await this.fileanagementService.deleteFileKb(userId, docId);
  }
  // 获取知识库文件列表
  @Get('kbfilelist')
  @UseGuards(AuthGuard)
  async kbFileList(@Req() req: { user: { token: string } }) {
    const userId = req.user.token;
    const res = await this.fileanagementModel.aggregate([
      { $match: { userId, uploadType: 'UB' } },
      {
        $project: {
          docId: '$_id',
          fileName: 1,
          fileType: 1,
          fileSize: 1,
          _id: 0,
        },
      },
    ]);
    return { result: res, message: 'SUCCESS' };
  }
  // 对话框文件上传
  @Post('uploaddialog')
  @UseGuards(AuthGuard)
  @UseInterceptors(uploadFileInterceptor)
  async uploadDialog(
    @Req() req: { user: { token: string } },
    @UploadedFiles() files: { file: Express.Multer.File[] },
    @Body() body: { wxoriginalname: string },
  ) {
    const userId = req.user.token;
    console.log(files.file);
    const wxnames = body.wxoriginalname || '';
    console.log('原文件名', wxnames);

    // 存储返回给前端的文档id
    const documentId: Types.ObjectId[] = [];
    // 处理上传的文档(for遍历处理多文件，推荐使用队列处理)
    // 处理标题编码问题
    const fixedFiles = (files.file || []).map((item) => ({
      ...item,
      originalname: wxnames != '' ? wxnames : this.fixOriginalName(item),
    }));
    for (const file of fixedFiles || []) {
      // 1.读取文档
      const { mergeTexts } = await this.fileanagementService.readFile(
        file,
        'UB',
      );
      // 2.上传数据库
      const docId = await this.fileanagementService.uploadFile(
        file,
        userId,
        mergeTexts,
        'UD',
      );
      documentId.push(docId);
    }
    console.log('全部上传完毕');
    return { result: documentId, message: 'SUCCESS' };
  }
  // 对话框删除指定文件
  @Post('deletefile')
  @UseGuards(AuthGuard)
  async deleteFile(
    @Req() req: { user: { token: string } },
    @Body() body: DeletefileDto,
  ) {
    const { docId } = body;
    const userId = req.user.token;
    return await this.fileanagementService.deleteFile(userId, docId);
  }
  // 恢复浏览器上传出现的文件标题编码乱的问题
  fixOriginalName(file: Express.Multer.File) {
    return Buffer.from(file.originalname, 'latin1').toString('utf8');
  }
  // 上传图片
  @Post('uploadimage')
  @UseGuards(AuthGuard)
  @UseInterceptors(uploadFileImage)
  uploadImage(@UploadedFiles() files: { file: Express.Multer.File[] }) {
    console.log(files);
    // 拼接图片地址，返回前端给用户看得到
    const baseUrl = this.configService.get<string>('IMAGE_BASE_URL_local');
    const imageUrl = `${baseUrl}/${files.file[0].filename}`;
    return {
      result: {
        imagePath: files.file[0].path,
        mimetype: files.file[0].mimetype,
        imageUrl,
      },
      message: 'SUCCESS',
    };
  }
  // 删除图片
  @Post('deleteimage')
  @UseGuards(AuthGuard)
  deleteImage(@Body() body: DeleteImageDto) {
    const { imagePath } = body;
    return this.fileanagementService.deleteImage(imagePath);
  }
}
