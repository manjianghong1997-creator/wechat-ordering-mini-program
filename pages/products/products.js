const { defaultCategories, normalizeCategories } = require('../../utils/menu-data')
const { cleanupDuplicateCategories, getCategories, saveCategories } = require('../../utils/cloud-db')

Page({
  data: {
    categories: [],
    activeCategoryId: '',
    currentProducts: [],
    categoryNames: [],
    categoryIndex: 0,
    productCount: 0,
    enabledCount: 0,
    form: {
      name: '',
      shortName: '',
      desc: '',
      price: ''
    }
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

      this.updateCategories(categories, this.data.activeCategoryId || categories[0].id)
    } catch (error) {
      console.error('加载云端商品失败', error)
      const categories = normalizeCategories(wx.getStorageSync('categories') || defaultCategories)

      this.updateCategories(categories, this.data.activeCategoryId || categories[0].id, false)
      wx.showToast({
        title: '已显示本地商品',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  onInput(event) {
    const field = event.currentTarget.dataset.field

    this.setData({
      [`form.${field}`]: event.detail.value
    })
  },

  onCategoryChange(event) {
    this.setData({
      categoryIndex: Number(event.detail.value)
    })
  },

  changeCategory(event) {
    const id = event.currentTarget.dataset.id

    this.updateCategories(this.data.categories, id)
  },

  async addProduct() {
    const form = this.data.form
    const name = form.name.trim()
    const shortName = form.shortName.trim() || name.slice(0, 4)
    const desc = form.desc.trim() || '暂无描述'
    const price = Number(form.price)
    const enabledCategories = this.data.categories.filter((item) => item.enabled !== false)
    const category = enabledCategories[this.data.categoryIndex]

    if (!name) {
      wx.showToast({
        title: '请输入商品名称',
        icon: 'none'
      })
      return
    }

    if (!price || price <= 0) {
      wx.showToast({
        title: '请输入正确价格',
        icon: 'none'
      })
      return
    }

    if (!category) {
      wx.showToast({
        title: '请先启用分类',
        icon: 'none'
      })
      return
    }

    const product = {
      id: `product-${Date.now()}`,
      categoryId: category.id,
      name,
      shortName,
      desc,
      price,
      colorClass: this.getColorClass(category.id),
      enabled: true
    }
    const categories = this.data.categories.map((item) => {
      if (item.id !== category.id) {
        return item
      }

      return {
        ...item,
        products: [product, ...item.products]
      }
    })

    await this.saveAndUpdate(categories, category.id)
    this.setData({
      form: {
        name: '',
        shortName: '',
        desc: '',
        price: ''
      }
    })

  },

  async toggleProduct(event) {
    const id = event.currentTarget.dataset.id
    const categories = this.data.categories.map((category) => ({
      ...category,
      products: category.products.map((product) => {
        if (product.id !== id) {
          return product
        }

        return {
          ...product,
          enabled: !product.enabled
        }
      })
    }))

    await this.saveAndUpdate(categories, this.data.activeCategoryId)
  },

  async saveAndUpdate(categories, activeCategoryId) {
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
      console.error('保存云端商品失败', error)
      this.updateCategories(categories, activeCategoryId)
      wx.showToast({
        title: '本地已保存，云端失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  updateCategories(categories, activeCategoryId, shouldSave = true) {
    const enabledCategories = categories.filter((category) => category.enabled !== false)
    const activeCategory = enabledCategories.find((item) => item.id === activeCategoryId) || enabledCategories[0] || categories[0]
    const productList = categories.reduce((list, category) => list.concat(category.products), [])
    const enabledCount = productList.filter((product) => product.enabled).length

    if (shouldSave) {
      wx.setStorageSync('categories', categories)
    }

    this.setData({
      categories,
      activeCategoryId: activeCategory.id,
      currentProducts: activeCategory.products,
      categoryNames: enabledCategories.map((category) => category.name),
      categoryIndex: 0,
      productCount: productList.length,
      enabledCount
    })
  },

  getColorClass(categoryId) {
    const colorMap = {
      hot: 'photo-red',
      snack: 'photo-yellow',
      drink: 'photo-blue'
    }

    return colorMap[categoryId] || 'photo-green'
  },

  backHome() {
    wx.reLaunch({
      url: '/pages/home/home'
    })
  }
})
