/**
 * Configurable XML element names for Foremost Graphics fulfillment integration.
 * When Foremost provides their exact XML spec, update these mappings instead of
 * rewriting the XML builder logic.
 */

export const fulfillmentSchema = {
  // Root
  orders: 'Orders',
  order: 'Order',

  // Order header
  orderNumber: 'OrderNumber',

  // Customer block
  customer: 'Customer',
  firstName: 'FirstName',
  lastName: 'LastName',
  email: 'Email',
  classDate: 'ClassDate',
  classType: 'ClassType',
  program: 'Program',
  status: 'Status',

  // Shipping block
  shippingAddress: 'ShippingAddress',
  shippingName: 'Name',
  shippingAttention: 'Attention',
  shippingAddress1: 'Address1',
  shippingAddress2: 'Address2',
  shippingCity: 'City',
  shippingState: 'State',
  shippingZip: 'Zip',
  shippingCountry: 'Country',

  // Line items
  lineItems: 'LineItems',
  lineItem: 'LineItem',
  productName: 'ProductName',
  sku: 'SKU',
  color: 'Color',
  size: 'Size',

  // Metadata (optional)
  orderDate: 'OrderDate',
} as const

export type FulfillmentSchema = typeof fulfillmentSchema
