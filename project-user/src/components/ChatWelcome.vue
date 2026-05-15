<template>
  <!-- 欢迎页面 -->
  <div class="chat-window">
    <div class="chat-message">
      <img src="../assets/zhanshi.png" alt="" class="display-image" />
      <span class="greeting-title">我是你的家庭医生助手,很高兴见到你！</span>
      <span class="greeting-span">无论你想了解各种疾病的症状、治疗方法，还是关心日常养生，我都能为你提供科学的解答和贴心的建议。</span>
    </div>
  </div>
</template>

<script>
// 逻辑层
</script>

<style scoped>
/* 样式层 */
.chat-window {
  width: 100%;
  margin-left: 230px;
  display: flex;
}
.chat-message {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  max-width: 1000px;
  margin: 0 auto;
  padding-bottom: 90px;
}
.display-image {
  width: 280px;
}
.greeting-title {
  font-size: 25px;
  padding-top: 15px;
}
.greeting-span {
  padding-top: 15px;
}
</style>
