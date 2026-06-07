const defaultTables = [
  { id: 'table-a01', no: 'A01', enabled: true },
  { id: 'table-a02', no: 'A02', enabled: true },
  { id: 'table-a03', no: 'A03', enabled: true },
  { id: 'table-a04', no: 'A04', enabled: true },
  { id: 'table-b01', no: 'B01', enabled: true },
  { id: 'table-b02', no: 'B02', enabled: true }
]
const { getTables, addTable, updateTableEnabled } = require('../../utils/cloud-db')

Page({
  data: {
    tables: [],
    enabledCount: 0,
    newTableNo: ''
  },

  onShow() {
    this.loadTables()
  },

  async loadTables() {
    wx.showLoading({
      title: '加载中'
    })

    try {
      const result = await getTables()
      const tables = result.data || []

      if (tables.length === 0) {
        await this.seedDefaultTables()
        return
      }

      this.updateTables(tables)
    } catch (error) {
      console.error('加载云端桌号失败', error)
      const tables = wx.getStorageSync('tables') || defaultTables

      this.updateTables(tables, false)
      wx.showToast({
        title: '已显示本地桌号',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  async seedDefaultTables() {
    const results = await Promise.all(defaultTables.map((table) => addTable({
      ...table,
      createdAt: new Date(),
      updatedAt: new Date()
    })))
    const tables = defaultTables.map((table, index) => ({
      ...table,
      _id: results[index]._id
    }))

    this.updateTables(tables)
  },

  onTableInput(event) {
    this.setData({
      newTableNo: event.detail.value.toUpperCase()
    })
  },

  async addTable() {
    const no = this.data.newTableNo.trim()

    if (!no) {
      wx.showToast({
        title: '请输入桌号',
        icon: 'none'
      })
      return
    }

    const isExist = this.data.tables.some((table) => table.no === no)

    if (isExist) {
      wx.showToast({
        title: '桌号已存在',
        icon: 'none'
      })
      return
    }

    const table = {
      id: `table-${Date.now()}`,
      no,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    wx.showLoading({
      title: '保存中'
    })

    try {
      const result = await addTable(table)
      const tables = [
        ...this.data.tables,
        {
          ...table,
          _id: result._id
        }
      ]

      this.updateTables(tables)
      this.setData({ newTableNo: '' })
      wx.showToast({
        title: '桌号已保存',
        icon: 'success'
      })
    } catch (error) {
      console.error('新增云端桌号失败', error)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  async toggleTable(event) {
    const id = event.currentTarget.dataset.id
    const targetTable = this.data.tables.find((table) => table.id === id)

    if (!targetTable) {
      return
    }

    const enabled = !targetTable.enabled
    const tables = this.data.tables.map((table) => {
      if (table.id !== id) {
        return table
      }

      return {
        ...table,
        enabled
      }
    })

    this.updateTables(tables)

    if (targetTable._id) {
      try {
        await updateTableEnabled(targetTable._id, enabled)
      } catch (error) {
        console.error('更新云端桌号失败', error)
        wx.showToast({
          title: '本地已更新，云端失败',
          icon: 'none'
        })
      }
    }
  },

  mockScan(event) {
    const tableNo = event.currentTarget.dataset.no

    wx.navigateTo({
      url: `/pages/index/index?tableNo=${tableNo}`
    })
  },

  updateTables(tables, shouldSave = true) {
    const enabledCount = tables.filter((table) => table.enabled).length

    if (shouldSave) {
      wx.setStorageSync('tables', tables)
    }
    this.setData({
      tables,
      enabledCount
    })
  },

  backHome() {
    wx.reLaunch({
      url: '/pages/home/home'
    })
  }
})
