Page({
  data: {
    order: {
      id: '',
      tableNo: '',
      items: [],
      totalCount: 0,
      totalAmount: 0,
      statusText: '',
      createdAt: ''
    }
  },

  onShow() {
    const order = wx.getStorageSync('latestOrder')

    if (!order) {
      wx.showToast({
        title: '暂无订单',
        icon: 'none'
      })
      return
    }

    this.setData({ order })
  },

  backToMenu() {
    wx.reLaunch({
      url: '/pages/index/index'
    })
  },

  viewOrders() {
    wx.navigateTo({
      url: '/pages/orders/orders'
    })
  }
})
