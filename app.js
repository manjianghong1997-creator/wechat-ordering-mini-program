App({
  globalData: {
    cloudEnv: 'cloud1-d9gz14l27a9a3b381'
  },

  onLaunch() {
    if (!wx.cloud) {
      wx.showToast({
        title: '基础库不支持云开发',
        icon: 'none'
      })
      return
    }

    wx.cloud.init({
      env: this.globalData.cloudEnv,
      traceUser: true
    })
  }
})
