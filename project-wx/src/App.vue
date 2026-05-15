<script setup lang="ts">
import { onLaunch } from "@dcloudio/uni-app";
import { projectStore } from "@/store/index";
onLaunch(() => {
  // 获取胶囊按钮的位置
  const buttonPosition = uni.getStorageSync("buttonPosition");
  if (!buttonPosition) {
    const res = uni.getMenuButtonBoundingClientRect();
    console.log(res);
    uni.setStorageSync("buttonPosition", res);
  }
  // 初始化获取用户数据
  projectStore().initUserFromStorage();
});
</script>
<style>
view,
text,
image {
  display: block;
}
.text-show {
  display: -webkit-box;
  text-overflow: ellipsis;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
