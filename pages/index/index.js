const { defaultCategories, normalizeCategories } = require('../../utils/menu-data')
const { getCategories, saveCategories } = require('../../utils/cloud-db')

function getVisibleCategories(categories) {
  return categories
    .filter((category) => category.enabled !== false)
    .map((category) => ({
      ...category,
      products: category.products.filter((product) => product.enabled)
    }))
    .filter((category) => category.products.length > 0)
}

Page({
  data: {
    shop: {
      name: '云上小馆',
      desc: '扫码点单演示店'
    },
    tableNo: 'A03',
    categories: [],
    activeCategoryId: '',
    currentProducts: [],
    cart: {},
    cartCount: 0,
    cartTotal: 0
  },

  onLoad(options) {
    const tableNo = options.tableNo || wx.getStorageSync('tableNo') || 'A03'

    this.setData({ tableNo })
    wx.setStorageSync('tableNo', tableNo)
  },

  onShow() {
    const savedCart = wx.getStorageSync('cart') || {}

    this.loadMenu()
    this.updateCart(savedCart, false)
  },

  async loadMenu() {
    let savedCategories = normalizeCategories(wx.getStorageSync('categories') || defaultCategories)

    try {
      const result = await getCategories()

      if (result.data && result.data.length > 0) {
        savedCategories = normalizeCategories(result.data)
      } else {
        await saveCategories(savedCategories)
      }
    } catch (error) {
      console.error('加载云端菜单失败', error)
    }

    const categories = getVisibleCategories(savedCategories)
    const activeCategoryId = categories.some((item) => item.id === this.data.activeCategoryId)
      ? this.data.activeCategoryId
      : categories[0] ? categories[0].id : ''
    const activeCategory = categories.find((item) => item.id === activeCategoryId)

    wx.setStorageSync('categories', savedCategories)

    this.setData({
      categories,
      activeCategoryId,
      currentProducts: activeCategory ? activeCategory.products : []
    })
  },

  changeCategory(event) {
    const id = event.currentTarget.dataset.id
    const category = this.data.categories.find((item) => item.id === id)

    this.setData({
      activeCategoryId: id,
      currentProducts: category ? category.products : []
    })
  },

  addToCart(event) {
    const productId = event.currentTarget.dataset.id
    let product = null

    this.data.categories.forEach((category) => {
      category.products.forEach((item) => {
        if (item.id === productId) {
          product = item
        }
      })
    })

    if (!product) {
      return
    }

    const cart = { ...this.data.cart }
    const oldItem = cart[productId]

    cart[productId] = {
      ...product,
      count: oldItem ? oldItem.count + 1 : 1
    }

    this.updateCart(cart)

    wx.showToast({
      title: '已加入购物车',
      icon: 'success'
    })
  },

  updateCart(cart, shouldSave = true) {
    const cartItems = Object.values(cart)
    const cartCount = cartItems.reduce((sum, item) => sum + item.count, 0)
    const cartTotal = cartItems.reduce((sum, item) => sum + item.count * item.price, 0)

    if (shouldSave) {
      wx.setStorageSync('cart', cart)
      wx.setStorageSync('tableNo', this.data.tableNo)
    }

    this.setData({
      cart,
      cartCount,
      cartTotal
    })
  },

  goToCart() {
    if (this.data.cartCount === 0) {
      wx.showToast({
        title: '请先选择商品',
        icon: 'none'
      })
      return
    }

    wx.navigateTo({
      url: '/pages/cart/cart'
    })
  },

  backHome() {
    wx.reLaunch({
      url: '/pages/home/home'
    })
  }
})
