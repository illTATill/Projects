<template>
  <view class="chat-window">
    <image src="/static/zhanshi.png" mode="widthFix" />
    <text>嗨！我是你的AI医生助手</text>
    <text>无论你想了解各种疾病的症状、治疗方法，还是关心日常养生，我都能为你提供科学的解答和贴心的建议。</text>
  </view>
</template>

<style scoped>
.chat-window {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 200rpx 25rpx 0 25rpx;
}
.chat-window image {
  width: 200rpx;
}
.chat-window text:nth-child(2) {
  font-weight: bold;
  padding: 20rpx 0;
}
.chat-window text:nth-child(3) {
  font-size: 28rpx;
}
</style>
