<template>
  <text class="login-tips">登录体验更多AI功能</text>
  <view class="login-view">
    <image class="logo" mode="aspectFill" src="/static/logo.png"></image>
    <view class="user-input">
      <input type="number" v-model="phoneNumber" placeholder="请输入手机号码，会和pc端同步数据" />
    </view>
    <view class="user-input">
      <input type="text" password v-model="passWord" placeholder="请输入密码" />
    </view>
    <view class="user-input" v-if="loginMode === '登录'">
      <input type="text" password v-model="confirmPassword" placeholder="再次输入密码" />
    </view>
    <text class="switch" @click="toggleLoginMode">{{ loginMode }}</text>
    <button class="submit-button" :loading="pinia.loginLoading" @click="handleLoginRegister">{{ loginMode == "登录" ? "注册" : "登录" }}</button>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { UserRegisterApi, UserLoginApi, GetChatListApi } from "@/api/request";
import { validators } from "@/utils/validators";
import { projectStore } from "@/store/index";
const pinia = projectStore();
// 切换
const loginMode = ref("注册");
const toggleLoginMode = () => {
  loginMode.value = loginMode.value === "登录" ? "注册" : "登录";
};
// 手机号，密码，确认密码
const phoneNumber = ref("");
const passWord = ref("");
const confirmPassword = ref("");
// 登录注册
const handleLoginRegister = async () => {
  validators.isPhoneNumber(phoneNumber.value);
  validators.isPasswordValid(passWord.value);
  // 登录
  if (loginMode.value == "注册") {
    console.log("登录");
    pinia.loginLoading = true;
    const res = await UserLoginApi({ phoneNumber: phoneNumber.value, password: passWord.value });
    console.log(res);
    pinia.userLogin(res.data);
    // 登录成功返回上一页
    uni.navigateBack({ delta: 1 });
    // 登录成功，立马获取对话列表数据和获取用户信息
    const chatListData = await GetChatListApi();
    pinia.chatListData = chatListData.data;
    pinia.initUserFromStorage();
  }
  // 注册
  if (loginMode.value == "登录") {
    console.log("注册");
    validators.isEqual(passWord.value, confirmPassword.value);
    pinia.loginLoading = true;
    await UserRegisterApi({
      phoneNumber: phoneNumber.value,
      password: passWord.value,
      confirmPassword: confirmPassword.value,
    });
    // 切换回登录
    loginMode.value = "注册";
  }
};
</script>

<style scoped>
.login-tips {
  font-weight: bold;
  padding: 40rpx 20rpx;
}
.login-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 50rpx 20rpx 0 20rpx;
}
.logo {
  width: 150rpx;
  height: 150rpx;
  margin-bottom: 20rpx;
}
.user-input {
  width: 100%;
  border-bottom: 1rpx solid #f2f2f2;
  padding: 20rpx 0;
}
.switch {
  text-align: end;
  width: 100%;
  padding: 20rpx 0;
  color: #5a66fc;
}
.submit-button {
  background: #5a66fc;
  color: #ffffff;
  width: 100%;
  margin-top: 25rpx;
}
</style>
