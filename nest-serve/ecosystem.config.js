module.exports = {
  apps: [
    {
      name: 'Agent', //智能体
      script: '/home/Agent-node/app.js', //appjs文件路径
      exec_mode: 'cluster', //启动集群
      instances: 'max',
    },
    {
      name: 'Guahao', //挂号项目
      script: '/home/guahao/app.js', //appjs文件路径
      exec_mode: 'cluster', //启动集群
      instances: 'max',
    },
    {
      name: 'Kemusi', //驾校小程序
      script: '/home/kemusi/app.js', //appjs文件路径
      exec_mode: 'cluster', //启动集群
      instances: 'max',
    },
    {
      name: 'Lvyounode', //旅游小程序第一个
      script: '/home/lvyou-node/app.js', //appjs文件路径
      exec_mode: 'cluster', //启动集群
      instances: 'max',
    },
    {
      name: 'Lvyounodev1', //旅游小程序第二个
      script: '/home/lvyou-node-v1/app.js', //appjs文件路径
      exec_mode: 'cluster', //启动集群
      instances: 'max',
    },
    // {
    //   name: 'Tianmao', //天猫小程序
    //   script: '/home/tianmao/app.js', //appjs文件路径
    //   exec_mode: 'cluster', //启动集群
    //   instances: 'max',
    // },
    // {
    //   name: 'Xianhuanode', //鲜花小程序
    //   script: '/home/xianhua-node/app.js', //appjs文件路径
    //   exec_mode: 'cluster', //启动集群
    //   instances: 'max',
    // },
    {
      name: 'Mynestapp',
      script: '/home/nest-serve-doctor/dist/src/main.js',
      exec_mode: 'cluster',
      instances: 'max',
      watch: false,
      env: {
        MONGODB_URI:
          'mongodb://user:user123@127.0.0.1:27017/nest_server_db?authSource=admin',
        PASSWORD_KEY: 'abcdefg',
        JWT_SECRET: '123456fhdhrufbhg',
        MILVUS_ADDRESS: '47.92.23.90:19530',
        TONGYI_AKI_KEY: 'sk-6c78b730c48c4865a66788713e69334d',
        REDIS_HOST: '127.0.0.1',
        REDIS_PORT: '6379',
        REDIS_PASSWORD: '123456we',
      },
    },
  ],
};
