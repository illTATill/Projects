export const showValidateMessage = (message: string, type: "success" | "warning" | "info" | "error", errorRequired: "yes" | "no" = "yes") => {
  ElMessage({
    message,
    type,
    plain: true,
    duration: 1400,
    offset: 40,
  });
  if (errorRequired === "yes") {
    throw message; // 统一抛出错误
  }
};
