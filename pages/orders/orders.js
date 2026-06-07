const statusMap = {
  pending: '待处理',
  cooking: '制作中',
  done: '已完成'
}
const { getOrders, updateOrderStatus } = require('../../utils/cloud-db')

Page({
  data: {
    orders: []
  },

  onShow() {
    this.loadOrders()
  },

  async loadOrders() {
    wx.showLoading({
      title: '加载中'
    })

    try {
      const result = await getOrders()
      const orders = result.data || []

      wx.setStorageSync('orders', orders)
      this.setData({ orders })
    } catch (error) {
      console.error('加载云端订单失败', error)
      const orders = wx.getStorageSync('orders') || []

      this.setData({ orders })
      wx.showToast({
        title: '已显示本地订单',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  async updateStatus(event) {
    const id = event.currentTarget.dataset.id
    const status = event.currentTarget.dataset.status
    const targetOrder = this.data.orders.find((order) => order.id === id)
    const orders = this.data.orders.map((order) => {
      if (order.id !== id) {
        return order
      }

      return {
        ...order,
        status,
        statusText: statusMap[status]
      }
    })

    wx.setStorageSync('orders', orders)
    this.setData({ orders })

    if (targetOrder && targetOrder._id) {
      try {
        await updateOrderStatus(targetOrder._id, status, statusMap[status])
      } catch (error) {
        console.error('更新云端订单状态失败', error)
        wx.showToast({
          title: '本地已更新，云端失败',
          icon: 'none'
        })
        return
      }
    }

    wx.showToast({
      title: '状态已更新',
      icon: 'success'
    })
  },

  clearOrders() {
    wx.showModal({
      title: '清空订单',
      content: '确定要清空所有本地订单吗？',
      success: (res) => {
        if (res.confirm) {
          wx.setStorageSync('orders', [])
          this.setData({ orders: [] })
        }
      }
    })
  },

  backToMenu() {
    wx.reLaunch({
      url: '/pages/index/index'
    })
  },

  backHome() {
    wx.reLaunch({
      url: '/pages/home/home'
    })
  },

  goStatistics() {
    wx.navigateTo({
      url: '/pages/statistics/statistics'
    })
  }
})
