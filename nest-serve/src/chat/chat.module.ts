import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { FileanagementModule } from 'src/fileanagement/fileanagement.module';
import { ChatData, ChatSchema } from './chat.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ChatData.name, schema: ChatSchema }]),
    FileanagementModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
