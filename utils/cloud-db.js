const db = () => wx.cloud.database()

function addOrder(order) {
  return db()
    .collection('orders')
    .add({
      data: order
    })
}

function getOrders() {
  return db()
    .collection('orders')
    .orderBy('createdAtValue', 'desc')
    .get()
}

function updateOrderStatus(cloudId, status, statusText) {
  return db()
    .collection('orders')
    .doc(cloudId)
    .update({
      data: {
        status,
        statusText,
        updatedAt: new Date()
      }
    })
}

function getTables() {
  return db()
    .collection('tables')
    .orderBy('no', 'asc')
    .get()
}

function addTable(table) {
  return db()
    .collection('tables')
    .add({
      data: table
    })
}

function updateTableEnabled(cloudId, enabled) {
  return db()
    .collection('tables')
    .doc(cloudId)
    .update({
      data: {
        enabled,
        updatedAt: new Date()
      }
    })
}

function getCategories() {
  return db()
    .collection('categories')
    .orderBy('sort', 'asc')
    .get()
}

function addCategory(category) {
  return db()
    .collection('categories')
    .add({
      data: category
    })
}

function updateCategory(cloudId, data) {
  return db()
    .collection('categories')
    .doc(cloudId)
    .update({
      data: {
        ...data,
        updatedAt: new Date()
      }
    })
}

function deleteCategory(cloudId) {
  return db()
    .collection('categories')
    .doc(cloudId)
    .remove()
}

async function cleanupDuplicateCategories(categories) {
  const seen = {}
  const tasks = []

  categories.forEach((category) => {
    const key = category.id || category.name

    if (!seen[key]) {
      seen[key] = true
      return
    }

    if (category._id) {
      tasks.push(deleteCategory(category._id))
    }
  })

  return Promise.all(tasks)
}

async function saveCategories(categories) {
  const tasks = categories.map((category, index) => {
    const data = {
      id: category.id,
      name: category.name,
      enabled: category.enabled !== false,
      products: category.products || [],
      sort: index,
      updatedAt: new Date()
    }

    if (category._id) {
      return updateCategory(category._id, data)
    }

    return addCategory({
      ...data,
      createdAt: new Date()
    })
  })

  return Promise.all(tasks)
}

module.exports = {
  addOrder,
  getOrders,
  updateOrderStatus,
  getTables,
  addTable,
  updateTableEnabled,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  cleanupDuplicateCategories,
  saveCategories
}
