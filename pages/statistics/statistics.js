const { getOrders } = require('../../utils/cloud-db')

Page({
  data: {
    totalRevenue: 0,
    orderCount: 0,
    pendingCount: 0,
    cookingCount: 0,
    doneCount: 0,
    pendingPercent: 0,
    cookingPercent: 0,
    donePercent: 0,
    foodRanks: []
  },

  async onShow() {
    wx.showLoading({
      title: '加载中'
    })

    try {
      const result = await getOrders()
      const orders = result.data || []

      wx.setStorageSync('orders', orders)
      this.calculateStats(orders)
    } catch (error) {
      console.error('加载云端统计失败', error)
      const orders = wx.getStorageSync('orders') || []

      this.calculateStats(orders)
      wx.showToast({
        title: '已显示本地统计',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  calculateStats(orders) {
    const orderCount = orders.length
    const pendingCount = orders.filter((order) => order.status === 'pending').length
    const cookingCount = orders.filter((order) => order.status === 'cooking').length
    const doneCount = orders.filter((order) => order.status === 'done').length
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0)
    const foodMap = {}

    orders.forEach((order) => {
      order.items.forEach((food) => {
        if (!foodMap[food.name]) {
          foodMap[food.name] = {
            name: food.name,
            count: 0,
            amount: 0
          }
        }

        foodMap[food.name].count += food.count
        foodMap[food.name].amount += food.count * food.price
      })
    })

    const foodRanks = Object.values(foodMap).sort((a, b) => b.count - a.count)

    this.setData({
      totalRevenue,
      orderCount,
      pendingCount,
      cookingCount,
      doneCount,
      pendingPercent: this.getPercent(pendingCount, orderCount),
      cookingPercent: this.getPercent(cookingCount, orderCount),
      donePercent: this.getPercent(doneCount, orderCount),
      foodRanks
    })
  },

  getPercent(value, total) {
    if (!total) {
      return 0
    }

    return Math.max(Math.round((value / total) * 100), value > 0 ? 6 : 0)
  },

  backHome() {
    wx.reLaunch({
      url: '/pages/home/home'
    })
  }
})
