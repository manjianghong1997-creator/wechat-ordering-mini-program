Page({
  data: {
    orderCount: 0,
    pendingCount: 0,
    doneCount: 0,
    cloudStatus: '待测试'
  },

  onShow() {
    const orders = wx.getStorageSync('orders') || []
    const pendingCount = orders.filter((order) => order.status === 'pending').length
    const doneCount = orders.filter((order) => order.status === 'done').length

    this.setData({
      orderCount: orders.length,
      pendingCount,
      doneCount
    })
  },

  goCustomer() {
    wx.navigateTo({
      url: '/pages/index/index'
    })
  },

  goAdmin() {
    wx.navigateTo({
      url: '/pages/orders/orders'
    })
  },

  goStatistics() {
    wx.navigateTo({
      url: '/pages/statistics/statistics'
    })
  },

  goTables() {
    wx.navigateTo({
      url: '/pages/tables/tables'
    })
  },

  goProducts() {
    wx.navigateTo({
      url: '/pages/products/products'
    })
  },

  goCategories() {
    wx.navigateTo({
      url: '/pages/categories/categories'
    })
  },

  testCloud() {
    if (!wx.cloud) {
      this.setData({
        cloudStatus: '当前基础库不支持云开发'
      })
      wx.showToast({
        title: '请检查基础库版本',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '测试中'
    })

    wx.cloud
      .database()
      .collection('cloud_tests')
      .add({
        data: {
          type: 'connect-test',
          message: '云开发连接成功',
          createdAt: new Date()
        }
      })
      .then(() => {
        this.setData({
          cloudStatus: '连接成功'
        })
        wx.showToast({
          title: '云开发正常',
          icon: 'success'
        })
      })
      .catch((error) => {
        console.error('云开发测试失败', error)
        this.setData({
          cloudStatus: '连接失败，请看控制台'
        })
        wx.showToast({
          title: '云开发测试失败',
          icon: 'none'
        })
      })
      .finally(() => {
        wx.hideLoading()
      })
  }
})
