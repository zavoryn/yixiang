export const messages = {
  // 通用
  loading: '加载中...',
  loadingMore: '正在加载更多...',
  endOfList: '— 到底啦 —',
  retry: '重试',
  error: '出错了',
  cancel: '取消',
  confirm: '确认',
  save: '保存',

  // 登录/注册
  loginTitle: '欢迎回到颐享',
  loginSubmit: '登录',
  registerTitle: '注册新账号',
  registerSubmit: '注册',
  logoutSuccess: '已退出登录',

  // Feed
  feedEmpty: '还没有任何内容',
  feedEmptyHint: '关注几个用户或加入一个圈子,这里就会有内容',

  // 通知
  notificationEmpty: '暂无通知',

  // 圈子
  circleJoined: '已加入圈子',
  circleLeft: '已退出圈子',

  // 帖子操作
  liked: '已点赞',
  unliked: '取消点赞',
  favorited: '已收藏',
  unfavorited: '取消收藏',
  followed: '已关注',
  unfollowed: '取消关注',

  // 错误
  networkError: '网络错误,请稍后重试',
  unauthorized: '请先登录',
  forbidden: '没有权限',
  notFound: '未找到资源',
} as const;
