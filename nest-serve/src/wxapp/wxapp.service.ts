import { Injectable } from '@nestjs/common';
import { WxApp } from './wxapp.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class WxappService {
  constructor(@InjectModel(WxApp.name) private wxAppModel: Model<WxApp>) {}
  // 导入小程序的首页数据
  async importWxData() {
    // const url = 'http://' + '127.0.0.1' + '/uploads/';
    const data = [
      {
        type: 'list',
        title: '身体的求救信号 🚨',
        subtitle: '看似正常的身体反应，背后藏着怎样的健康真相?',
        data: [
          {
            cover: 'https://lstkk.oss-cn-beijing.aliyuncs.com/ai-yiliao/tizhong.webp',
            title: '体重变化异常',
            describe:
              '如果在没有刻意节食、运动的情况下体重持续下降，可能是身体在发出健康警告',
            question: '体重莫名其妙下降是怎么回事',
          },
          {
            cover: 'https://lstkk.oss-cn-beijing.aliyuncs.com/ai-yiliao/pilao.webp',
            title: '持续疲劳乏力',
            describe:
              '睡眠充足却总是感到疲惫，可能不仅仅是“累”，而是身体机能出了问题',
            question: '为什么我每天睡够8小时还是觉得很累？',
          },
          {
            cover: 'https://lstkk.oss-cn-beijing.aliyuncs.com/ai-yiliao/xintiao.webp',
            title: '心跳与呼吸异常',
            describe:
              '没运动也没紧张，却感觉心跳加快、胸口发慌，这可能是心律失常、甲亢、焦虑症甚至心脏病的早期信号。别忽视这些“瞬间不适”。',
            question: '没做剧烈运动却心跳加快，是怎么回事？',
          },
        ],
      },
      {
        type: 'single',
        data: [
          {
            cover: 'https://lstkk.oss-cn-beijing.aliyuncs.com/ai-yiliao/aizibing.jpeg',
            title: '艾滋病传播方式',
            describe:
              '艾滋病的传播方式非常明确，仅通过三种渠道：性传播、血液传播和母婴传播',
            question: '艾滋病到底是通过哪些方式传播的？日常接触会被传染吗？',
          },
        ],
      },
    ];
    await this.wxAppModel.insertMany(data);
    return { message: 'SUCCESS', result: [] };
  }
  // 获取小程序端首页数据
  async wxFrontPageData() {
    const res = await this.wxAppModel.find();
    return { message: 'SUCCESS', result: res };
  }
}
