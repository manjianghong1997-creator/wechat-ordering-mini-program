const { defaultCategories, normalizeCategories } = require('../../utils/menu-data')
const { cleanupDuplicateCategories, getCategories, saveCategories } = require('../../utils/cloud-db')

Page({
  data: {
    categories: [],
    enabledCount: 0,
    newCategoryName: ''
  },

  onShow() {
    this.loadCategories()
  },

  async loadCategories() {
    wx.showLoading({
      title: '加载中'
    })

    try {
      const result = await getCategories()
      const categories = result.data && result.data.length > 0
        ? normalizeCategories(result.data)
        : normalizeCategories(wx.getStorageSync('categories') || defaultCategories)

      if (result.data && result.data.length > categories.length) {
        await cleanupDuplicateCategories(result.data)
      }

      if (!result.data || result.data.length === 0) {
        await saveCategories(categories)
      }

      this.updateCategories(categories)
    } catch (error) {
      console.error('加载云端分类失败', error)
      const categories = normalizeCategories(wx.getStorageSync('categories') || defaultCategories)

      this.updateCategories(categories, false)
      wx.showToast({
        title: '已显示本地分类',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  onCategoryInput(event) {
    this.setData({
      newCategoryName: event.detail.value
    })
  },

  async addCategory() {
    const name = this.data.newCategoryName.trim()

    if (!name) {
      wx.showToast({
        title: '请输入分类名称',
        icon: 'none'
      })
      return
    }

    const isExist = this.data.categories.some((category) => category.name === name)

    if (isExist) {
      wx.showToast({
        title: '分类已存在',
        icon: 'none'
      })
      return
    }

    const category = {
      id: `category-${Date.now()}`,
      name,
      enabled: true,
      products: []
    }
    const categories = [...this.data.categories, category]

    await this.saveAndUpdate(categories)
    this.setData({ newCategoryName: '' })
  },

  async toggleCategory(event) {
    const id = event.currentTarget.dataset.id
    const categories = this.data.categories.map((category) => {
      if (category.id !== id) {
        return category
      }

      return {
        ...category,
        enabled: !category.enabled
      }
    })

    await this.saveAndUpdate(categories)
  },

  async saveAndUpdate(categories) {
    wx.showLoading({
      title: '保存中'
    })

    try {
      await saveCategories(categories)
      await this.loadCategories()
      wx.showToast({
        title: '已保存',
        icon: 'success'
      })
    } catch (error) {
      console.error('保存云端分类失败', error)
      this.updateCategories(categories)
      wx.showToast({
        title: '本地已保存，云端失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  updateCategories(categories, shouldSave = true) {
    const enabledCount = categories.filter((category) => category.enabled !== false).length

    if (shouldSave) {
      wx.setStorageSync('categories', categories)
    }
    this.setData({
      categories,
      enabledCount
    })
  },

  backHome() {
    wx.reLaunch({
      url: '/pages/home/home'
    })
  }
})
