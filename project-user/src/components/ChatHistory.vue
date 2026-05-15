<template>
  <!-- 左侧边栏：消息列表 -->
  <div class="chat-history-view">
    <div class="new-dialog">
      <el-button type="primary" :icon="Plus" :disabled="project.disabledStatus" @click="createSession">新建对话</el-button>
    </div>
    <div style="height: 80px"></div>
    <div
      class="dialog-list"
      v-for="(item, index) in project.chatListData"
      :key="index"
      @click="handleSessionClick(index, item.sessionId)"
      :style="{ backgroundColor: index === project.sessionIndex ? '#f3f2ff' : '' }"
    >
      <div class="dialog-list-item hidden-text" :style="{ color: index === project.sessionIndex ? '#615ced' : '' }">{{ item.content }}</div>
      <el-icon color="rgb(97, 92, 237)" class="delete-icon" @click.stop="delteChat(item.sessionId, item.content, index)"><CloseBold /></el-icon>
    </div>
    <div style="height: 120px"></div>
    <!-- 个人信息 -->
    <div class="user-profile">
      <div class="avatar-username" v-if="project.userInfo">
        <img :src="project.userInfo.avatar" alt="" />
        <span>{{ project.userInfo.phoneNumber }}</span>
      </div>
      <el-button v-else type="primary" size="default" @click="project.showLoginPopup = true">登录</el-button>
      <el-button type="primary" size="default" v-if="project.userInfo" @click="project.knowledgePopup = true">知识库管理</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, CloseBold } from "@element-plus/icons-vue";
import { projectStore } from "@/store/index";
const project = projectStore();
import { GetChatListApi, DeleteChatApi } from "@/api/request";
import { onMounted } from "vue";
import { getItemChat } from "@/api/getItemChat";
import { showValidateMessage } from "@/utils/validateMessage";
// 逻辑层
onMounted(async () => {
  const res = await GetChatListApi();
  console.log(res);
  project.chatListData = res.data;
  // 获取当前对话下的数据
  if (project.sessionId !== "null") {
    await getItemChat(project.sessionIndex, project.sessionId);
  }
});
// 点击每个会话
const handleSessionClick = async (index: number, sessionId: string) => {
  if (project.disabledStatus) return false;
  await getItemChat(index, sessionId);
};
// 新建对话
const createSession = () => {
  project.chatWelcome = true;
  project.getSessIonIndex(-1);
  project.getSessionId("null");
  project.messageList = [];
};
// 删除会话
const delteChat = (sessionId: string, content: string, index: number) => {
  console.log("会话id----" + sessionId);
  ElMessageBox.confirm(`删除：${content}`, "删除对话后不可恢复", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      console.log("删除");
      try {
        await DeleteChatApi({ sessionId });
        project.chatListData.splice(index, 1);
        showValidateMessage("删除成功", "success", "no");
        createSession();
      } catch (error) {
        console.log(error);
        showValidateMessage("删除失败", "warning");
      }
    })
    .catch(() => {
      console.log("取消");
    });
};
</script>

<style scoped>
/* 样式层 */
.chat-history-view {
  background-color: #ffffff;
  width: 230px;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  overflow-y: auto;
}
.new-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 230px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
}
.dialog-list {
  margin: 10px;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.dialog-list:hover {
  background-color: #f3f2ff;
  cursor: v-bind("project.disabledStatus ? 'not-allowed' : 'pointer'");
}
.dialog-list:hover .dialog-list-item {
  color: #615ced;
}
.delete-icon {
  display: none;
}
.dialog-list:hover .delete-icon {
  display: block !important;
}
.dialog-list-item {
  margin-right: 5px;
}
.user-profile {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 230px;
  height: 120px;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.avatar-username {
  display: flex;
  align-items: center;
  padding-bottom: 20px;
}
.avatar-username img {
  width: 30px;
  height: 30px;
  object-fit: cover;
  border-radius: 50%;
  margin-right: 7px;
}
</style>
