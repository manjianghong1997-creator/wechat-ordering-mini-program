function normalizeCategories(categories) {
  const categoryMap = {}
  const result = []

  categories.forEach((category) => {
    const key = category.id || category.name
    const products = category.products || []

    if (!categoryMap[key]) {
      const normalizedCategory = {
        ...category,
        enabled: category.enabled !== false,
        products: dedupeProducts(products)
      }

      categoryMap[key] = normalizedCategory
      result.push(normalizedCategory)
      return
    }

    categoryMap[key].products = dedupeProducts([
      ...categoryMap[key].products,
      ...products
    ])
  })

  return result
}

function dedupeProducts(products) {
  const productMap = {}
  const result = []

  products.forEach((product) => {
    const key = product.id || product.name

    if (productMap[key]) {
      return
    }

    const normalizedProduct = {
      ...product,
      enabled: product.enabled !== false
    }

    productMap[key] = normalizedProduct
    result.push(normalizedProduct)
  })

  return result
}

const defaultCategories = [
  {
    id: 'hot',
    name: '热销',
    enabled: true,
    products: [
      {
        id: 'beef-noodle',
        categoryId: 'hot',
        name: '招牌牛肉面',
        shortName: '牛肉面',
        desc: '大块牛肉，汤底浓郁',
        price: 28,
        colorClass: 'photo-red',
        enabled: true
      },
      {
        id: 'chicken-rice',
        categoryId: 'hot',
        name: '鸡腿饭',
        shortName: '鸡腿饭',
        desc: '现烤鸡腿，配时蔬',
        price: 24,
        colorClass: 'photo-green',
        enabled: true
      }
    ]
  },
  {
    id: 'snack',
    name: '小吃',
    enabled: true,
    products: [
      {
        id: 'fried-dumpling',
        categoryId: 'snack',
        name: '煎饺',
        shortName: '煎饺',
        desc: '外皮焦香，一份 8 个',
        price: 16,
        colorClass: 'photo-yellow',
        enabled: true
      },
      {
        id: 'cucumber',
        categoryId: 'snack',
        name: '拍黄瓜',
        shortName: '黄瓜',
        desc: '清爽开胃，微辣口味',
        price: 10,
        colorClass: 'photo-green',
        enabled: true
      }
    ]
  },
  {
    id: 'drink',
    name: '饮品',
    enabled: true,
    products: [
      {
        id: 'lemon-tea',
        categoryId: 'drink',
        name: '柠檬茶',
        shortName: '柠檬茶',
        desc: '清甜解腻，冰爽推荐',
        price: 12,
        colorClass: 'photo-blue',
        enabled: true
      },
      {
        id: 'soy-milk',
        categoryId: 'drink',
        name: '豆浆',
        shortName: '豆浆',
        desc: '每日现磨，冷热可选',
        price: 6,
        colorClass: 'photo-yellow',
        enabled: true
      }
    ]
  }
]

module.exports = {
  defaultCategories,
  normalizeCategories
}
