<template>
  <view class="chat-input">
    <!-- 上传的文件列表 -->
    <scroll-view scroll-x enable-flex style="white-space: nowrap" enhanced :show-scrollbar="false" v-if="pinia.uploadFileItem.length > 0">
      <view class="file-item" v-for="(item, index) in pinia.uploadFileItem" :key="index">
        <view class="file-icon"><image :src="item.fileType == 'PDF' ? '/static/pdf-icon.png' : '/static/docx-icon.png'"></image></view>
        <view class="file-name">
          <text>{{ item.fileName }}</text>
          <text>{{ item.fileSize }}</text>
        </view>
        <image class="delete-file" src="/static/shanchu.png" @click="deleteFile(item.docId, index)"></image>
      </view>
    </scroll-view>
    <!-- 输入框 -->
    <view class="user-input">
      <textarea
        placeholder="请输入内容"
        maxlength="500"
        :auto-height="autoHeight"
        style="width: 100%"
        confirm-type="next"
        :show-confirm-bar="false"
        @linechange="lineChange"
        v-model="userMessage"
      ></textarea>
    </view>
    <!-- 知识库按钮 -->
    <view class="action-button">
      <view @click="uploadFile">
        <image src="/static/select.png" mode="widthFix"></image>
      </view>
      <view class="kb-button">
        <button plain @click="queryKb">查询医学库</button>
      </view>
      <view>
        <button plain class="user-send" @click="sendMessage" v-if="!pinia.disabledStatus">
          <image src="/static/send-icon.png" mode="widthFix"></image>
        </button>
        <button plain class="user-send" v-if="pinia.disabledStatus" @click="stopOutput">
          <image src="/static/stop-icon.png" mode="widthFix"></image>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useFileUploader } from "@/api/useFileUploader";
import { UploadDialogApi, DeleteFileApi, SendMessageApi, StopOutputApi } from "@/api/request";
import { projectStore } from "@/store/index";
import { validators } from "@/utils/validators";
const pinia = projectStore();
import { onShow } from "@dcloudio/uni-app";
// 输入框自动增高
const autoHeight = ref(true);
// 输入框行数变化
const lineChange = (event: { detail: { lineCount: number } }) => {
  // console.log(event);
  autoHeight.value = event.detail.lineCount >= 4 ? false : true;
};
// 上传文件
const uploadFile = async () => {
  await useFileUploader({ page: "chatinput", uploadApi: UploadDialogApi });
};
// 删除指定文件
const deleteFile = async (docId: string, index: number) => {
  try {
    uni.showLoading({ title: "删除中" });
    await DeleteFileApi({ docId });
    uni.hideLoading();
    pinia.uploadFileItem.splice(index, 1);
  } catch (error) {
    uni.showToast({ title: "删除出错", icon: "none" });
  }
};
// 控制知识库选择
const isKnowledgeBased = ref(false);
const queryKbStyle = reactive({
  border: "#eceff3",
  backgroundColor: "#ffffff",
  color: "#d783af",
});
// 点击知识库按钮
const queryKb = () => {
  isKnowledgeBased.value = !isKnowledgeBased.value;
  if (isKnowledgeBased.value) {
    // 选中
    queryKbStyle.backgroundColor = "#597CEE";
    queryKbStyle.border = "#597CEE";
    queryKbStyle.color = "#ffffff";
  } else {
    queryKbStyle.backgroundColor = "#ffffff";
    queryKbStyle.border = "#eceff3";
    queryKbStyle.color = "#d783af";
  }
};
// 发送消息
const userMessage = ref("");
const sendMessage = () => {
  validators.isNotEmpty(userMessage.value, "请输入内容");
  pinia.messageList.push(
    {
      role: "user",
      content: userMessage.value.trim(),
      ...(pinia.uploadFileItem.length > 0 && { uploadFileList: pinia.uploadFileItem }),
      ...(pinia.uploadFileItem.length > 0 && { displayContent: userMessage.value.trim() }),
    },
    {
      role: "assistant",
      content: "",
      loadingCircle: true,
    }
  );
  console.log(pinia.messageList);

  // 禁用按钮
  pinia.disabledStatus = true;
  pinia.chatWelcome = false;
  // 如果是新建对话，需要把问题加入对话列表的第一项里
  if (pinia.sessionId == "null") {
    pinia.chatListData.unshift({ sessionId: pinia.sessionId, content: userMessage.value.trim() });
    pinia.sessionIndex = 0;
  }
  // 发送消息
  SendMessageApi({
    content: userMessage.value.trim(),
    sessionId: pinia.sessionId,
    uploadFileList: pinia.uploadFileItem,
    isKnowledgeBased: isKnowledgeBased.value,
  });
  // 清空输入框和临时文件还有首页的问一问
  userMessage.value = "";
  pinia.uploadFileItem = [];
  pinia.homeAsk = "null";
};
// 终止模型输出
const stopOutput = () => {
  console.log("终止");
  StopOutputApi({ sessionId: pinia.sessionId });
};
// 首页点击问一问触发
onShow(() => {
  console.log(pinia.homeAsk);
  if (pinia.homeAsk !== "null") {
    userMessage.value = pinia.homeAsk;
    sendMessage();
  }
});
</script>

<style scoped>
.chat-input {
  background-color: #ffffff;
  position: fixed;
  left: 0;
  bottom: 0;
  right: 0;
  padding: 0 10rpx 30rpx 10rpx;
}
.file-item {
  display: inline-flex;
  border: 1rpx solid #f3f3f3;
  padding: 7rpx 10rpx;
  border-radius: 10rpx;
  width: 270rpx;
  margin-right: 10rpx;
  position: relative;
  margin-top: 10rpx;
}
.file-icon image {
  width: 50rpx;
  height: 50rpx;
}
.file-icon {
  display: flex;
  align-self: center;
}
.file-name {
  display: flex;
  flex-direction: column;
  padding-left: 10rpx;
  overflow: hidden;
}
.file-name text:nth-child(1) {
  font-size: 25rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.file-name text:nth-child(2) {
  font-size: 20rpx;
  color: #8d8ea5;
}
.delete-file {
  width: 27rpx;
  height: 27rpx;
  position: absolute;
  bottom: 3rpx;
  right: 5rpx;
}
.user-input {
  padding: 30rpx 0;
}
/* 按钮 */
.action-button {
  display: flex;
  align-items: center;
}
.action-button image {
  width: 63rpx;
}
button {
  padding: inherit !important;
  margin: inherit !important;
  line-height: inherit !important;
  border: none !important;
  background: none !important;
}
.kb-button button {
  padding: 10rpx 15rpx !important;
  color: v-bind("queryKbStyle.color");
  background-color: v-bind("queryKbStyle.backgroundColor") !important;
  font-size: 28rpx;
  border-radius: 50rpx;
}
/* 自定义边框 */
.kb-button wx-button:after {
  border: 2rpx solid v-bind("queryKbStyle.border");
  border-radius: 50rpx;
}
.user-send {
  width: 63rpx;
  height: 63rpx;
}
.kb-button {
  display: flex;
  flex: 1;
  padding: 0 25rpx;
}
</style>
