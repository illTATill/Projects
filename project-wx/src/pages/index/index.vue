<template>
  <block v-for="(item, index) in wxAppHomeData" :key="index">
    <view class="main-content" v-if="item.type == 'list'">
      <text class="section-title">{{ item.title }}</text>
      <text class="section-description">{{ item.subtitle }}</text>
      <view v-for="(itema, indexa) in item.data" :key="indexa" class="content-item" @click="trigger(itema.question)">
        <view class="item-image">
          <image :src="itema.cover" mode="aspectFill"></image>
        </view>
        <view class="item-details">
          <text class="item-title">{{ itema.title }}</text>
          <text class="item-description text-show">{{ itema.describe }}</text>
          <view class="item-ask">
            <image src="/static/wenyiwen.png"></image>
            <text>问一问</text>
          </view>
        </view>
      </view>
    </view>
    <!-- 单块 -->
    <view class="single-block" v-if="item.type == 'single'" v-for="(itema, indexa) in item.data" :key="indexa" @click="trigger(itema.question)">
      <view class="fengmian-image">
        <image :src="itema.cover" mode="aspectFill"></image>
      </view>
      <view class="single-block-title">
        <text>{{ itema.title }}</text>
        <text>{{ itema.describe }}</text>
      </view>
      <view class="item-ask single-block-question">
        <image src="/static/wenyiwen.png"></image>
        <text>问一问</text>
      </view>
    </view>
  </block>
  <view style="height: 60rpx"></view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { WxAppHomeApi } from "@/api/request";
import type { WxAppHomeType } from "@/types/index";
import { projectStore } from "@/store/index";
const pinia = projectStore();

const wxAppHomeData = ref<WxAppHomeType>([]);
onLoad(async () => {
  const res = await WxAppHomeApi();
  console.log(res.data);
  wxAppHomeData.value = res.data;
});
// 问一问
const trigger = (value: string) => {
  pinia.homeAsk = value;
  uni.switchTab({ url: "/pages/chat/chat" });
};
</script>

<style>
.main-content {
  background-image: linear-gradient(to right, #ec77ab 0%, #7873f5 100%);
  padding: 35rpx 20rpx;
  border-radius: 30rpx;
  margin: 20rpx;
}

.section-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
  padding-bottom: 10rpx;
}

.section-description {
  font-size: 30rpx;
  color: #fff;
}

.content-item {
  display: flex;
  align-items: center;
  margin-top: 35rpx;
}

.item-image {
  width: 200rpx;
  height: 200rpx;
  margin-right: 20rpx;
}
.item-image image {
  width: 200rpx;
  height: 200rpx;
  border-radius: 20rpx;
}

.item-details {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 200rpx;
}

.item-title {
  font-size: 35rpx;
  font-weight: bold;
  color: #fff;
}

.item-description {
  font-size: 30rpx;
  color: #fff;
}
.item-ask {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  background-color: darkcyan;
  border-radius: 30rpx;
  padding: 10rpx 20rpx;
  font-size: 25rpx;
  color: #fff;
}
.item-ask image {
  width: 30rpx;
  height: 30rpx;
  margin-right: 15rpx;
}
.single-block {
  border-radius: 30rpx;
  margin: 20rpx;
  height: 700rpx;
  position: relative;
  overflow: hidden;
}
.fengmian-image {
  height: 700rpx;
}
.fengmian-image image {
  height: 700rpx;
  width: 100%;
}
.single-block-title {
  position: absolute;
  bottom: 0;
  left: 0;
  padding: 60rpx 20rpx 20rpx 20rpx;
  background: linear-gradient(to bottom, rgba(118, 133, 137, 0.01) 1%, rgba(118, 133, 137, 0.7) 30%, rgba(118, 133, 137, 1) 70%);
  color: #ffffff;
}
.single-block-title text:nth-child(1) {
  font-size: 40rpx;
  font-weight: bold;
}
.single-block-title text:nth-child(2) {
  font-size: 30rpx;
}
.single-block-question {
  position: absolute;
  top: 20rpx;
  left: 20rpx;
}
</style>
