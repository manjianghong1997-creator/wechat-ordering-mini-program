const { addOrder } = require('../../utils/cloud-db')

Page({
  data: {
    tableNo: 'A03',
    cart: {},
    cartItems: [],
    cartCount: 0,
    cartTotal: 0
  },

  onShow() {
    const tableNo = wx.getStorageSync('tableNo') || 'A03'
    const cart = wx.getStorageSync('cart') || {}

    this.setData({ tableNo })
    this.updateCart(cart)
  },

  increaseCount(event) {
    const id = event.currentTarget.dataset.id
    const cart = { ...this.data.cart }

    if (!cart[id]) {
      return
    }

    cart[id].count += 1
    this.updateCart(cart)
  },

  decreaseCount(event) {
    const id = event.currentTarget.dataset.id
    const cart = { ...this.data.cart }

    if (!cart[id]) {
      return
    }

    if (cart[id].count <= 1) {
      delete cart[id]
    } else {
      cart[id].count -= 1
    }

    this.updateCart(cart)
  },

  removeItem(event) {
    const id = event.currentTarget.dataset.id
    const cart = { ...this.data.cart }

    delete cart[id]
    this.updateCart(cart)
  },

  clearCart() {
    wx.showModal({
      title: '清空购物车',
      content: '确定要删除所有已选商品吗？',
      success: (res) => {
        if (res.confirm) {
          this.updateCart({})
        }
      }
    })
  },

  updateCart(cart) {
    const cartItems = Object.values(cart)
    const cartCount = cartItems.reduce((sum, item) => sum + item.count, 0)
    const cartTotal = cartItems.reduce((sum, item) => sum + item.count * item.price, 0)

    wx.setStorageSync('cart', cart)

    this.setData({
      cart,
      cartItems,
      cartCount,
      cartTotal
    })
  },

  async submitOrder() {
    if (this.data.cartCount === 0) {
      wx.showToast({
        title: '购物车为空',
        icon: 'none'
      })
      return
    }

    const order = {
      id: `OD${Date.now()}`,
      tableNo: this.data.tableNo,
      items: this.data.cartItems,
      totalCount: this.data.cartCount,
      totalAmount: this.data.cartTotal,
      status: 'pending',
      statusText: '待处理',
      createdAt: this.formatTime(new Date()),
      createdAtValue: new Date()
    }
    const orders = wx.getStorageSync('orders') || []

    orders.unshift(order)
    wx.setStorageSync('orders', orders)

    wx.showLoading({
      title: '提交中'
    })

    try {
      const result = await addOrder(order)
      const cloudOrder = {
        ...order,
        _id: result._id,
        saveMode: 'cloud'
      }

      wx.setStorageSync('latestOrder', cloudOrder)
      this.updateCart({})

      wx.navigateTo({
        url: '/pages/order-success/order-success'
      })
    } catch (error) {
      console.error('云端提交订单失败', error)
      wx.setStorageSync('latestOrder', {
        ...order,
        saveMode: 'local'
      })
      wx.showModal({
        title: '云端提交失败',
        content: '订单已先保存到本地，请检查云数据库 orders 集合和权限。',
        showCancel: false,
        success: () => {
          this.updateCart({})
          wx.navigateTo({
            url: '/pages/order-success/order-success'
          })
        }
      })
    } finally {
      wx.hideLoading()
    }
  },

  formatTime(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day} ${hour}:${minute}`
  },

  backToMenu() {
    wx.navigateBack()
  }
})
