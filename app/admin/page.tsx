'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { fetchAllRows } from '@/lib/fetch-all-rows'
import * as XLSX from 'xlsx'
import { OrderWithItems } from '@/types'
import {
  buildCadetOrderDetailRows,
  buildCadetProductCountRows,
  cadetExportFilename,
} from '@/lib/cadet-admin-export'
import HelpIcon from '@/components/HelpIcon'

/** PostgREST errors often have message/code on the prototype; `console.log(err)` can look like `{}`. */
function messageFromSupabaseError(err: unknown): string {
  if (err instanceof Error && err.message) return err.message
  if (!err || typeof err !== 'object') return String(err)
  const o = err as { message?: string; details?: string; hint?: string; code?: string }
  const parts = [o.message, o.details, o.hint, o.code].filter(Boolean)
  return parts.length > 0 ? parts.join(' — ') : 'Request failed (no details from server).'
}

/** Opens default mail client to resend a new-hire kit code to the assignee. */
function buildResendCodeMailto(assignment: { email: string; code: string }): string {
  const subject = 'Republic Airways New Hire Kit'
  const body = [
    'Hi,',
    '',
    "We're thrilled to welcome you to Republic Airways and start our journey together.",
    '',
    'Before takeoff, please use the following redemption code to select your desired new hire swag kit. Your selected kit will be delivered to the Republic Airways Training Center for pick up.',
    '',
    'Link: https://ra-new-hires.vercel.app/',
    '',
    `Code: ${assignment.code}`,
    '',
    'Thanks!',
  ].join('\r\n')

  return `mailto:${encodeURIComponent(assignment.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export default function AdminPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  /** Shown when the orders + items fetch fails (distinct from “no orders yet”). */
  const [ordersLoadError, setOrdersLoadError] = useState<string | null>(null)
  const [authenticated, setAuthenticated] = useState(false)
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null)
  const [confirmCancel, setConfirmCancel] = useState<{ orderId: string; orderNumber: string } | null>(null)
  const [cancelMessage, setCancelMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showGeneratePanel, setShowGeneratePanel] = useState(false)
  const [codeQuantity, setCodeQuantity] = useState<number>(10)
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([])
  const [savingCodes, setSavingCodes] = useState(false)
  const [generatingCodes, setGeneratingCodes] = useState(false)
  const [codeMessage, setCodeMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showCodeManager, setShowCodeManager] = useState(false)
  const [accessCodes, setAccessCodes] = useState<any[]>([])
  const [loadingCodes, setLoadingCodes] = useState(false)
  const [editingCodeId, setEditingCodeId] = useState<string | null>(null)
  const [codeFilter, setCodeFilter] = useState<'all' | 'used' | 'unused'>('all')
  const [codeManagerPage, setCodeManagerPage] = useState(1)
  const [codeManagerItemsPerPage, setCodeManagerItemsPerPage] = useState(25)
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [showProductsPopup, setShowProductsPopup] = useState<{
    orderId: string
    items: OrderWithItems['items']
    program: string
    code?: string
    email?: string
    first_name?: string
    last_name?: string
    tshirt_size?: string
  } | null>(null)
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [bulkAction, setBulkAction] = useState<'status' | 'cancel' | null>(null)
  const [bulkStatus, setBulkStatus] = useState<'Pending' | 'Backorder' | 'Fulfillment' | 'Delivered'>('Pending')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [sortColumn, setSortColumn] = useState<keyof OrderWithItems>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Backorder' | 'Fulfillment' | 'Delivered'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [exportLoading, setExportLoading] = useState(false)
  // Shown when the admin clicks export: Yes updates Pending rows to Fulfillment after download.
  const [showExportConfirm, setShowExportConfirm] = useState(false)
  // Code Assignments: who was assigned which code (upload CSV/Excel, searchable backup)
  const [showCodeAssignmentsModal, setShowCodeAssignmentsModal] = useState(false)
  type CodeAssignment = { id: string; email: string; name: string | null; code: string; created_at: string }
  const [codeAssignments, setCodeAssignments] = useState<CodeAssignment[]>([])
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  const [assignmentSearchQuery, setAssignmentSearchQuery] = useState('')
  const [assignmentPage, setAssignmentPage] = useState(1)
  const assignmentPageSize = 10
  const [uploadingAssignments, setUploadingAssignments] = useState(false)
  const [assignmentMessage, setAssignmentMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    // Check if user is admin (ADMIN code)
    const adminAuth = sessionStorage.getItem('adminAuth')
    const userCode = sessionStorage.getItem('userCode')
    const ADMIN_CODE = 'ADMIN'
    
    const isAdmin = adminAuth === 'true' || (userCode !== null && userCode.toUpperCase() === ADMIN_CODE)
    
    if (isAdmin) {
      setAuthenticated(true)
      loadOrders()
    } else {
      // Redirect to landing page if not admin
      window.location.href = '/'
    }
  }, [])

  useEffect(() => {
    if (showCodeManager) {
      loadAccessCodes()
    }
  }, [showCodeManager])

  useEffect(() => {
    if (showCodeAssignmentsModal) {
      loadCodeAssignments()
    }
  }, [showCodeAssignmentsModal])

  // Reset to page 1 when search changes so results stay relevant
  useEffect(() => {
    setAssignmentPage(1)
  }, [assignmentSearchQuery])

  // Search filters across all assignments; pagination slices the filtered result
  const filteredAssignments = useMemo(() => {
    const q = assignmentSearchQuery.trim().toLowerCase()
    if (!q) return codeAssignments
    return codeAssignments.filter(
      r =>
        (r.name || '').toLowerCase().includes(q) ||
        (r.email || '').toLowerCase().includes(q) ||
        (r.code || '').toLowerCase().includes(q)
    )
  }, [codeAssignments, assignmentSearchQuery])

  // Lock body scroll when Code Manager or Code Assignments is open
  useEffect(() => {
    if (showCodeManager || showCodeAssignmentsModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showCodeManager, showCodeAssignmentsModal])

  const loadOrders = async () => {
    try {
      setLoading(true)
      setOrdersLoadError(null)

      // Page through PostgREST's 1000-row default limit so all historical orders load.
      const ordersList = await fetchAllRows((from, to) =>
        supabase
          .from('ra_cadet_orders')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, to)
      )
      const orderIds = ordersList.map((o) => o.id).filter(Boolean)
      // One items query per chunk avoids hundreds of parallel requests (brittle in the browser) and long URLs.
      // ID_CHUNK=100 keeps each response under PostgREST's 1000-row default (~5 items/order ≈ 500 rows).
      const itemsByOrderId: Record<string, OrderWithItems['items']> = {}
      const ID_CHUNK = 100
      for (let i = 0; i < orderIds.length; i += ID_CHUNK) {
        const chunk = orderIds.slice(i, i + ID_CHUNK)
        const { data: chunkItems, error: itemsError } = await supabase
          .from('ra_cadet_order_items')
          .select('*')
          .in('order_id', chunk)

        if (itemsError) {
          throw new Error(messageFromSupabaseError(itemsError))
        }
        for (const item of chunkItems ?? []) {
          const oid = item.order_id as string
          if (!itemsByOrderId[oid]) itemsByOrderId[oid] = []
          itemsByOrderId[oid].push(item)
        }
      }
      for (const oid of Object.keys(itemsByOrderId)) {
        itemsByOrderId[oid].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      }

      const ordersWithItems: OrderWithItems[] = ordersList.map((order) => ({
        ...order,
        items: itemsByOrderId[order.id] ?? []
      }))

      setOrders(ordersWithItems)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : messageFromSupabaseError(err)
      console.error('Failed to load orders:', message, err)
      setOrdersLoadError(message)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  // Restore inventory for a product (add quantity back). Used when cancelling orders so stock
  // stays accurate for t-shirts (inventory + inventory_by_size) and kits (inventory).
  const restoreInventory = async (productId: string, size: string | null, quantity: number = 1): Promise<void> => {
    try {
      const { data: product, error: fetchError } = await supabase
        .from('ra_cadet_products')
        .select('inventory, inventory_by_size, category')
        .eq('id', productId)
        .single()

      if (fetchError) throw fetchError

      const newInventory = (product.inventory || 0) + quantity
      let newInventoryBySize = product.inventory_by_size || {}
      if (size && newInventoryBySize[size] !== undefined) {
        newInventoryBySize = {
          ...newInventoryBySize,
          [size]: (newInventoryBySize[size] || 0) + quantity
        }
      }

      const updateData: { inventory: number; inventory_by_size?: Record<string, number> } = {
        inventory: newInventory
      }
      if (size && newInventoryBySize[size] !== undefined) {
        updateData.inventory_by_size = newInventoryBySize
      }

      const { error: updateError } = await supabase
        .from('ra_cadet_products')
        .update(updateData)
        .eq('id', productId)

      if (updateError) throw updateError
    } catch (error) {
      console.error('Error restoring inventory:', error)
      throw error
    }
  }

  // Build list of (product_id, size) to restore: one unit per distinct product/size.
  // Kit orders have many order items (one per component) with the same product_id; we restore
  // the kit once, not once per component, so inventory stays correct.
  const getRestoreListFromOrderItems = (items: OrderWithItems['items']): { productId: string; size: string | null }[] => {
    const key = (productId: string, size: string | null) => `${productId}|${size ?? ''}`
    const seen = new Set<string>()
    const list: { productId: string; size: string | null }[] = []
    for (const item of items) {
      // Cadet kit lines can have a null product_id until catalog rows are fully seeded.
      if (!item.product_id) continue
      const k = key(item.product_id, item.size || null)
      if (seen.has(k)) continue
      seen.add(k)
      list.push({ productId: item.product_id, size: item.size || null })
    }
    return list
  }

  const handleCancelOrder = async (orderId: string) => {
    try {
      setCancelingOrderId(orderId)
      const order = orders.find(o => o.id === orderId)
      if (!order) {
        throw new Error('Order not found')
      }

      // Restore inventory first (one unit per product/size so kits aren’t over-restored)
      const toRestore = getRestoreListFromOrderItems(order.items)
      for (const { productId, size } of toRestore) {
        await restoreInventory(productId, size, 1)
      }

      // Mark code as unused in access codes table if it exists
      const { data: accessCode } = await supabase
        .from('ra_cadet_access_codes')
        .select('id')
        .eq('code', order.code)
        .single()

      if (accessCode) {
        await supabase
          .from('ra_cadet_access_codes')
          .update({
            used: false,
            used_at: null,
            order_id: null,
            email: null
          })
          .eq('id', accessCode.id)
      }

      // Delete the order (cascade deletes order items). Inventory was already restored above.
      const { data: deletedData, error: deleteError } = await supabase
        .from('ra_cadet_orders')
        .delete()
        .eq('id', orderId)
        .select()

      if (deleteError) {
        console.error('Delete error:', deleteError)
        throw deleteError
      }

      if (!deletedData || deletedData.length === 0) {
        console.error('No rows deleted - order may not exist')
        throw new Error('Order could not be deleted. It may have already been deleted.')
      }

      console.log('Order deleted successfully:', deletedData)

      // Refresh orders list
      await loadOrders()
      
      // Show success message in modal
      setCancelMessage({
        type: 'success',
        message: `Order ${order.order_number} has been canceled successfully. Inventory has been restored.`
      })
      
      // Close confirmation dialog
      setConfirmCancel(null)
    } catch (err: any) {
      console.error('Failed to cancel order:', err)
      // Show error message in modal
      setCancelMessage({
        type: 'error',
        message: `Failed to cancel order: ${err.message || 'Unknown error'}`
      })
      // Keep confirmation dialog open so user can try again or close
    } finally {
      setCancelingOrderId(null)
    }
  }

  // Generate random 6-letter codes, excluding existing codes in DB and within the batch
  const generateCodes = (quantity: number, existingCodeSet: Set<string>): string[] => {
    const codes: string[] = []
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const maxAttempts = quantity * 1000 // Prevent infinite loop if code space is nearly full
    let attempts = 0

    while (codes.length < quantity && attempts < maxAttempts) {
      let code = ''
      for (let i = 0; i < 6; i++) {
        code += letters.charAt(Math.floor(Math.random() * letters.length))
      }

      // Ensure code is unique: not ADMIN, not in DB, not already in this batch
      if (code !== 'ADMIN' && !existingCodeSet.has(code) && !codes.includes(code)) {
        codes.push(code)
        existingCodeSet.add(code) // Track so we don't regenerate in same batch
      }
      attempts++
    }

    return codes
  }

  const handleGenerateCodes = async () => {
    if (codeQuantity < 1 || codeQuantity > 1000) {
      alert('Please enter a quantity between 1 and 1000')
      return
    }

    setGeneratingCodes(true)
    try {
      // Fetch all existing codes from DB to avoid duplicates
      const { data: existingCodes } = await supabase
        .from('ra_cadet_access_codes')
        .select('code')
      const existingCodeSet = new Set(existingCodes?.map((c: { code: string }) => c.code) || [])

      // Also exclude codes already used in orders (one order per code)
      const { data: orderCodes } = await supabase
        .from('ra_cadet_orders')
        .select('code')
      for (const o of orderCodes ?? []) {
        if (o?.code) existingCodeSet.add(o.code)
      }

      const codes = generateCodes(codeQuantity, existingCodeSet)
      setGeneratedCodes(codes)

      if (codes.length < codeQuantity) {
        setCodeMessage({
          type: 'error',
          message: `Only generated ${codes.length} of ${codeQuantity} unique codes. The code space may be nearly full.`
        })
      } else {
        setCodeMessage(null)
      }
    } catch (err: any) {
      console.error('Failed to generate codes:', err)
      setCodeMessage({
        type: 'error',
        message: `Failed to generate codes: ${err.message || 'Unknown error'}`
      })
    } finally {
      setGeneratingCodes(false)
    }
  }

  const handleSaveCodes = async () => {
    if (generatedCodes.length === 0) {
      setCodeMessage({
        type: 'error',
        message: 'No codes to save. Please generate codes first.'
      })
      return
    }

    try {
      setSavingCodes(true)
      
      // Check which codes already exist in database
      const { data: existingCodes } = await supabase
        .from('ra_cadet_access_codes')
        .select('code')
        .in('code', generatedCodes)

      const existingCodeSet = new Set(existingCodes?.map(c => c.code) || [])
      const newCodes = generatedCodes.filter(code => !existingCodeSet.has(code))

      if (newCodes.length === 0) {
        setCodeMessage({
          type: 'error',
          message: 'All generated codes already exist in the database.'
        })
        setSavingCodes(false)
        return
      }

      // Insert new codes
      const codesToInsert = newCodes.map(code => ({
        code,
        used: false,
        created_by: 'admin'
      }))

      const { data: insertedData, error: insertError } = await supabase
        .from('ra_cadet_access_codes')
        .insert(codesToInsert)
        .select()

      if (insertError) {
        console.error('Insert error details:', insertError)
        throw new Error(insertError.message || `Database error: ${JSON.stringify(insertError)}`)
      }

      setCodeMessage({
        type: 'success',
        message: `Successfully saved ${newCodes.length} code(s) to database.${existingCodeSet.size > 0 ? ` ${existingCodeSet.size} code(s) were already in the database.` : ''}`
      })
      // Refresh Code Manager list so new codes appear
      await loadAccessCodes()
      // Clear generated list after successful save
      setGeneratedCodes([])
    } catch (err: any) {
      console.error('Failed to save codes:', err)
      const errorMessage = err.message || err.toString() || JSON.stringify(err) || 'Unknown error occurred'
      setCodeMessage({
        type: 'error',
        message: `Failed to save codes: ${errorMessage}`
      })
    } finally {
      setSavingCodes(false)
    }
  }

  const handleExportCodes = () => {
    if (generatedCodes.length === 0) {
      alert('No codes to export. Please generate codes first.')
      return
    }

    const wb = XLSX.utils.book_new()
    const codesData = generatedCodes.map((code, index) => ({
      'Code': code,
      'Status': 'Generated',
      'Generated Date': new Date().toLocaleDateString()
    }))

    const ws = XLSX.utils.json_to_sheet(codesData)
    XLSX.utils.book_append_sheet(wb, ws, 'Access Codes')

    const filename = `ra-new-hire-access-codes-${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, filename)
  }

  const loadAccessCodes = async () => {
    try {
      setLoadingCodes(true)
      const { data, error } = await supabase
        .from('ra_cadet_access_codes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAccessCodes(data || [])
    } catch (err: any) {
      console.error('Failed to load access codes:', err)
      setCodeMessage({
        type: 'error',
        message: `Failed to load codes: ${err.message || 'Unknown error'}`
      })
    } finally {
      setLoadingCodes(false)
    }
  }

  const loadCodeAssignments = async () => {
    try {
      setLoadingAssignments(true)
      const { data, error } = await supabase
        .from('ra_cadet_code_assignments')
        .select('id, email, name, code, created_at')
        .order('created_at', { ascending: false })
      if (error) throw error
      setCodeAssignments((data as CodeAssignment[]) || [])
      setAssignmentMessage(null)
    } catch (err: any) {
      console.error('Failed to load code assignments:', err)
      setAssignmentMessage({ type: 'error', message: `Failed to load: ${err.message || 'Unknown error'}` })
      setCodeAssignments([])
    } finally {
      setLoadingAssignments(false)
    }
  }

  const handleUploadAssignments = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      setAssignmentMessage({ type: 'error', message: 'Please upload a CSV or Excel file (.csv, .xlsx, .xls)' })
      return
    }
    setUploadingAssignments(true)
    setAssignmentMessage(null)
    try {
      const data = await file.arrayBuffer()
      const wb = XLSX.read(data, { type: 'array' })
      const firstSheet = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as unknown[][]
      if (rows.length < 2) {
        setAssignmentMessage({ type: 'error', message: 'File must have a header row and at least one data row.' })
        setUploadingAssignments(false)
        return
      }
      const headers = (rows[0] as string[]).map(h => String(h || '').trim().toLowerCase())
      const emailIdx = headers.findIndex(h => h === 'email' || h === 'e-mail')
      const codeIdx = headers.findIndex(h => h === 'code')
      const nameIdx = headers.findIndex(h => h === 'name')
      if (emailIdx < 0 || codeIdx < 0) {
        setAssignmentMessage({ type: 'error', message: 'File must have "email" and "code" columns.' })
        setUploadingAssignments(false)
        return
      }
      const toInsert: { email: string; name: string | null; code: string }[] = []
      let skipped = 0
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i] as unknown[]
        const email = String(row[emailIdx] ?? '').trim()
        const code = String(row[codeIdx] ?? '').trim()
        const name = nameIdx >= 0 ? String(row[nameIdx] ?? '').trim() || null : null
        if (!email || !code) {
          skipped++
          continue
        }
        toInsert.push({ email, name, code })
      }
      if (toInsert.length === 0) {
        setAssignmentMessage({ type: 'error', message: `No valid rows to import. ${skipped} row(s) skipped (missing email or code).` })
        setUploadingAssignments(false)
        return
      }
      const { error } = await supabase.from('ra_cadet_code_assignments').insert(toInsert)
      if (error) throw error
      await loadCodeAssignments()
      setAssignmentMessage({
        type: 'success',
        message: `Imported ${toInsert.length} assignment(s).${skipped > 0 ? ` ${skipped} row(s) skipped (missing email or code).` : ''}`
      })
    } catch (err: any) {
      console.error('Failed to upload assignments:', err)
      setAssignmentMessage({ type: 'error', message: `Failed to import: ${err.message || 'Unknown error'}` })
    } finally {
      setUploadingAssignments(false)
      e.target.value = ''
    }
  }

  const handleDownloadAssignmentsTemplate = () => {
    const templateData = [
      { email: 'john.doe@example.com', code: 'ABCDEF', name: 'John Doe' },
      { email: 'jane.smith@example.com', code: 'GHIJKL', name: 'Jane Smith' }
    ]
    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Code Assignments')
    XLSX.writeFile(wb, 'code-assignments-template.xlsx')
  }

  // Export current list (including search filter) as Excel; columns align with import (email, code, name) plus uploaded timestamp.
  const handleExportCodeAssignments = () => {
    if (filteredAssignments.length === 0) {
      setAssignmentMessage({ type: 'error', message: 'No assignments to export.' })
      return
    }
    const exportData = filteredAssignments.map((r) => ({
      email: r.email,
      code: r.code,
      name: r.name ?? '',
      uploaded: new Date(r.created_at).toLocaleString()
    }))
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Code Assignments')
    const date = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `code-assignments-export-${date}.xlsx`)
    setAssignmentMessage({
      type: 'success',
      message: `Exported ${exportData.length} assignment(s)${assignmentSearchQuery.trim() ? ' (matching current search)' : ''}.`
    })
  }

  const handleToggleCodeStatus = async (codeId: string, currentStatus: boolean) => {
    try {
      setEditingCodeId(codeId)
      const { error } = await supabase
        .from('ra_cadet_access_codes')
        .update({
          used: !currentStatus,
          used_at: !currentStatus ? new Date().toISOString() : null,
          email: !currentStatus ? null : undefined,
          order_id: !currentStatus ? null : undefined
        })
        .eq('id', codeId)

      if (error) throw error

      await loadAccessCodes()
      setCodeMessage({
        type: 'success',
        message: `Code ${!currentStatus ? 'marked as used' : 'marked as unused'} successfully.`
      })
    } catch (err: any) {
      console.error('Failed to update code:', err)
      setCodeMessage({
        type: 'error',
        message: `Failed to update code: ${err.message || 'Unknown error'}`
      })
    } finally {
      setEditingCodeId(null)
    }
  }

  const handleDeleteCode = async (codeId: string, code: string) => {
    if (!confirm(`Are you sure you want to delete code ${code}? This cannot be undone.`)) {
      return
    }

    try {
      setEditingCodeId(codeId)
      const { data: deletedRows, error } = await supabase
        .from('ra_cadet_access_codes')
        .delete()
        .eq('id', codeId)
        .select('id')

      if (error) throw error
      if (!deletedRows?.length) {
        throw new Error(
          'No row was deleted. Check RLS: ra_cadet_access_codes needs a FOR DELETE policy (see migrations/30-ra-new-hire-access-codes-delete-policy.sql).'
        )
      }

      await loadAccessCodes()
      setCodeMessage({
        type: 'success',
        message: `Code ${code} deleted successfully.`
      })
    } catch (err: any) {
      console.error('Failed to delete code:', err)
      setCodeMessage({
        type: 'error',
        message: `Failed to delete code: ${err.message || 'Unknown error'}`
      })
    } finally {
      setEditingCodeId(null)
    }
  }

  useEffect(() => {
    if (showCodeManager && accessCodes.length === 0) {
      loadAccessCodes()
    }
  }, [showCodeManager])

  // One admin export: Order Details + Product Counts (1 tee + 1 backpack + 1 pen + 1 lanyard per order).
  // `updateToFulfillment` is the Yes path from the confirm popup — Pending orders become Fulfillment after download.
  const exportCadetWorkbook = async (updateToFulfillment: boolean) => {
    if (orders.length === 0) return
    const pendingIds = orders
      .filter((order) => (order.status || 'Pending') === 'Pending')
      .map((order) => order.id)

    setExportLoading(true)
    try {
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(buildCadetOrderDetailRows(orders)), 'Order Details')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(buildCadetProductCountRows(orders)), 'Product Counts')
      XLSX.writeFile(wb, cadetExportFilename())

      if (updateToFulfillment && pendingIds.length > 0) {
        const ID_CHUNK = 100
        for (let i = 0; i < pendingIds.length; i += ID_CHUNK) {
          const chunk = pendingIds.slice(i, i + ID_CHUNK)
          const { error } = await supabase
            .from('ra_cadet_orders')
            .update({ status: 'Fulfillment' })
            .in('id', chunk)
          if (error) throw error
        }
        await loadOrders()
      }
    } catch (err: any) {
      console.error('Export error:', err)
      alert('Failed to export. Please try again.')
    } finally {
      setExportLoading(false)
      setShowExportConfirm(false)
    }
  }

  // Filter orders by status, then by search (order number, code, name, email, t-shirt size)
  const filteredByStatus = statusFilter === 'all'
    ? orders
    : orders.filter(order => (order.status || 'Pending') === statusFilter)
  const filteredOrders = !searchQuery.trim()
    ? filteredByStatus
    : filteredByStatus.filter(order => {
        const q = searchQuery.trim().toLowerCase()
        const name = `${order.first_name || ''} ${order.last_name || ''}`.toLowerCase()
        const email = (order.email || '').toLowerCase()
        const orderNumber = (order.order_number || '').toLowerCase()
        const code = (order.code || '').toLowerCase()
        const tshirtSize = (order.tshirt_size || '').toLowerCase()
        return (
          name.includes(q) ||
          email.includes(q) ||
          orderNumber.includes(q) ||
          code.includes(q) ||
          tshirtSize.includes(q)
        )
      })

  // Sorting logic
  const sortedOrders = filteredOrders.length > 0 ? [...filteredOrders].sort((a, b) => {
    let aValue: any = a[sortColumn]
    let bValue: any = b[sortColumn]
    
    // Handle nested properties
    if (sortColumn === 'created_at') {
      aValue = new Date(a.created_at).getTime()
      bValue = new Date(b.created_at).getTime()
    } else if (sortColumn === 'first_name' || sortColumn === 'last_name') {
      // For name sorting, combine first and last name
      aValue = `${a.first_name} ${a.last_name}`.toLowerCase()
      bValue = `${b.first_name} ${b.last_name}`.toLowerCase()
    } else if (sortColumn === 'tshirt_size') {
      aValue = (a.tshirt_size || '').toLowerCase()
      bValue = (b.tshirt_size || '').toLowerCase()
    } else if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  }) : []

  // Pagination calculations
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedOrders = sortedOrders.slice(startIndex, endIndex)
  const currentPageSelectedOrders = paginatedOrders.filter(o => selectedOrders.has(o.id))
  const allCurrentPageSelected = paginatedOrders.length > 0 && currentPageSelectedOrders.length === paginatedOrders.length

  // Match portal logic: a code is consumed if an order exists, even when access_codes.used was never updated.
  const orderCodesClaimedSet = useMemo(() => {
    const s = new Set<string>()
    for (const o of orders) {
      if (o.code) s.add(String(o.code).toUpperCase())
    }
    return s
  }, [orders])

  const isAccessCodeEffectivelyUsed = (row: { code?: string; used?: boolean }) =>
    Boolean(row.used) ||
    Boolean(row.code && orderCodesClaimedSet.has(String(row.code).toUpperCase()))

  // Code Manager: filtered list and pagination
  const filteredAccessCodes = accessCodes.filter(code => {
    if (codeFilter === 'used') return isAccessCodeEffectivelyUsed(code)
    if (codeFilter === 'unused') return !isAccessCodeEffectivelyUsed(code)
    return true
  })
  const codeManagerTotalPages = Math.max(1, Math.ceil(filteredAccessCodes.length / codeManagerItemsPerPage))
  const codeManagerStartIndex = (codeManagerPage - 1) * codeManagerItemsPerPage
  const codeManagerEndIndex = codeManagerStartIndex + codeManagerItemsPerPage
  const paginatedAccessCodes = filteredAccessCodes.slice(codeManagerStartIndex, codeManagerEndIndex)

  // Handle column header click
  const handleSort = (column: keyof OrderWithItems) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
    setCurrentPage(1) // Reset to first page when sorting changes
  }

  // Sort indicator component
  const SortIndicator = ({ column }: { column: keyof OrderWithItems }) => {
    if (sortColumn !== column) {
      return (
        <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 ml-1 text-[#c8102e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 ml-1 text-[#c8102e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ backgroundColor: '#00263a' }}>
        <div className="text-white text-xl">Checking admin access...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4 relative" style={{ backgroundColor: '#00263a' }}>
      <HelpIcon />
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">

          {loading ? (
            <div className="text-center py-12">
              <div className="text-lg text-gray-600">Loading orders...</div>
            </div>
          ) : ordersLoadError ? (
            <div className="text-center py-12 space-y-4 max-w-lg mx-auto">
              <div className="text-lg font-medium text-red-700">Could not load orders</div>
              <p className="text-sm text-gray-700 break-words">{ordersLoadError}</p>
              <button
                type="button"
                onClick={loadOrders}
                className="px-4 py-2 rounded-md bg-[#c8102e] text-white hover:bg-[#e63946] transition-colors"
              >
                Retry
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-lg text-gray-600">No orders yet</div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="p-2 rounded-md bg-[#c8102e] text-white hover:bg-[#e63946] hover:scale-110 transition-all"
                    title="Back to Landing Page"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </button>
                  <input
                    type="search"
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#c8102e] focus:border-transparent bg-white min-w-[180px]"
                    title="Search by order #, code, name, email, or t-shirt size"
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as typeof statusFilter)
                      setCurrentPage(1) // Reset to first page when filter changes
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#c8102e] focus:border-transparent bg-white"
                    title="Filter by status"
                  >
                    <option value="all">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Backorder">Backorder</option>
                    <option value="Fulfillment">Fulfillment</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
                <div className="text-center flex-1">
                  <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
                  <p className="text-gray-600 mt-1">Total Orders: {sortedOrders.length} {statusFilter !== 'all' && `(${orders.length} total)`}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCodeManager(!showCodeManager)}
                    className="p-2 rounded-md bg-[#c8102e] text-white hover:bg-[#e63946] hover:scale-110 transition-all"
                    title={showCodeManager ? 'Hide Code Manager' : 'Manage Codes'}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setShowCodeAssignmentsModal(!showCodeAssignmentsModal)
                      if (!showCodeAssignmentsModal) setShowCodeManager(false)
                    }}
                    className="p-2 rounded-md bg-[#c8102e] text-white hover:bg-[#e63946] hover:scale-110 transition-all"
                    title={showCodeAssignmentsModal ? 'Hide Code Assignments' : 'Code Assignments'}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={loadOrders}
                    className="p-2 rounded-md bg-[#c8102e] text-white hover:bg-[#e63946] hover:scale-110 transition-all"
                    title="Refresh orders"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  {selectedOrders.size > 0 && (
                    <button
                      onClick={() => setShowBulkEdit(true)}
                      className="p-2 rounded-md bg-[#c8102e] text-white hover:bg-[#e63946] hover:scale-110 transition-all"
                      title={`Bulk edit ${selectedOrders.size} selected order(s)`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => setShowExportConfirm(true)}
                    disabled={orders.length === 0 || exportLoading}
                    className="p-2 rounded-md bg-[#c8102e] text-white hover:bg-[#e63946] hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#c8102e] disabled:hover:scale-100 transition-all"
                    title="Export Excel: Order Details and Product Counts"
                  >
                    {exportLoading ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-300px)]">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={allCurrentPageSelected}
                        onChange={(e) => {
                          const newSelected = new Set(selectedOrders)
                          if (e.target.checked) {
                            paginatedOrders.forEach(order => newSelected.add(order.id))
                          } else {
                            paginatedOrders.forEach(order => newSelected.delete(order.id))
                          }
                          setSelectedOrders(newSelected)
                        }}
                        className="rounded border-gray-300 text-[#c8102e] focus:ring-[#c8102e]"
                      />
                    </th>
                    <th 
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center justify-center">
                        Date
                        <SortIndicator column="created_at" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('order_number')}
                    >
                      <div className="flex items-center justify-center">
                        Order #
                        <SortIndicator column="order_number" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center justify-center">
                        Status
                        <SortIndicator column="status" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('first_name')}
                    >
                      <div className="flex items-center justify-center">
                        Name
                        <SortIndicator column="first_name" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('tshirt_size')}
                    >
                      <div className="flex items-center justify-center">
                        T-Shirt Size
                        <SortIndicator column="tshirt_size" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedOrders.map((order) => (
                    <tr key={order.id} className={selectedOrders.has(order.id) ? 'bg-blue-50' : ''}>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={selectedOrders.has(order.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedOrders)
                            if (e.target.checked) {
                              newSelected.add(order.id)
                            } else {
                              newSelected.delete(order.id)
                            }
                            setSelectedOrders(newSelected)
                          }}
                          className="rounded border-gray-300 text-[#c8102e] focus:ring-[#c8102e]"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                        {order.order_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <select
                          value={order.status || 'Pending'}
                          onChange={async (e) => {
                            const newStatus = e.target.value as 'Pending' | 'Backorder' | 'Fulfillment' | 'Delivered'
                            try {
                              const { error } = await supabase
                                .from('ra_cadet_orders')
                                .update({ status: newStatus })
                                .eq('id', order.id)
                              
                              if (error) throw error
                              await loadOrders()
                            } catch (err: any) {
                              console.error('Failed to update status:', err)
                              alert(`Failed to update status: ${err.message || 'Unknown error'}`)
                            }
                          }}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-[#c8102e] focus:border-transparent"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Backorder">Backorder</option>
                          <option value="Fulfillment">Fulfillment</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {order.first_name} {order.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {order.tshirt_size || '–'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => setShowProductsPopup({
                              orderId: order.id,
                              items: order.items,
                              program: order.program,
                              code: order.code,
                              email: order.email,
                              first_name: order.first_name,
                              last_name: order.last_name,
                              tshirt_size: order.tshirt_size
                            })}
                            className="p-2 rounded-md bg-[#c8102e] text-white hover:bg-[#e63946] hover:scale-110 transition-all"
                            title="View products"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setConfirmCancel({ orderId: order.id, orderNumber: order.order_number })}
                            disabled={cancelingOrderId === order.id}
                            className="p-2 rounded-md bg-[#c8102e] text-white hover:bg-[#e63946] hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#c8102e] disabled:hover:scale-100 transition-all"
                            title="Cancel this order"
                          >
                            {cancelingOrderId === order.id ? (
                              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              
              {/* Pagination Controls */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Show:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-[#c8102e] focus:border-transparent"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-gray-700">per page</span>
                </div>
                <div className="flex-1 text-center">
                  <span className="text-sm text-gray-700">
                    Showing {startIndex + 1} to {Math.min(endIndex, sortedOrders.length)} of {sortedOrders.length} orders
                  </span>
                </div>
                <div className="flex gap-1">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                      title="First page"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                      title="Previous page"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                      title="Next page"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                      title="Last page"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
            </div>
          )}
        </div>
      </div>

      {/* Code Manager Modal */}
      {showCodeManager && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => { setShowCodeManager(false); setShowGeneratePanel(false) }}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 max-w-5xl w-full mx-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex justify-between items-center border-b pb-4 mb-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <select
                  value={codeFilter}
                  onChange={(e) => {
                    setCodeFilter(e.target.value as 'all' | 'used' | 'unused')
                    setCodeManagerPage(1)
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#c8102e] focus:border-transparent bg-white"
                >
                  <option value="all">All Codes</option>
                  <option value="used">Used Only</option>
                  <option value="unused">Unused Only</option>
                </select>
              </div>
              <h2 className="text-xl font-bold text-gray-900 absolute left-1/2 -translate-x-1/2">Access Code Manager</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowGeneratePanel(!showGeneratePanel)}
                  className="p-2 rounded-md bg-[#c8102e] text-white hover:bg-[#e63946] hover:scale-110 transition-all"
                  title={showGeneratePanel ? 'Hide Generate Codes' : 'Generate Codes'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <button
                  onClick={loadAccessCodes}
                  disabled={loadingCodes}
                  className="p-2 rounded-md bg-[#c8102e] text-white hover:bg-[#e63946] hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#c8102e] disabled:hover:scale-100 transition-all"
                  title="Refresh"
                >
                  {loadingCodes ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => { setShowCodeManager(false); setShowGeneratePanel(false) }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            {codeMessage && (
              <div className={`mb-4 px-4 py-2 rounded-md text-sm ${codeMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {codeMessage.message}
              </div>
            )}
            {showGeneratePanel && (
              <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50 flex-shrink-0">
                <div className="flex gap-4 items-end mb-4">
                  <div className="flex-1">
                    <label htmlFor="codeQuantity" className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Codes to Generate
                    </label>
                    <input
                      type="number"
                      id="codeQuantity"
                      min="1"
                      max="1000"
                      value={codeQuantity}
                      onChange={(e) => setCodeQuantity(parseInt(e.target.value) || 10)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c8102e] focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={handleGenerateCodes}
                    disabled={generatingCodes}
                    className="px-6 py-2 bg-[#c8102e] text-white rounded-md hover:bg-[#e63946] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generatingCodes ? 'Generating...' : 'Generate Codes'}
                  </button>
                </div>
                {generatedCodes.length > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-medium text-gray-700">
                        Generated {generatedCodes.length} code(s)
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveCodes}
                          disabled={savingCodes || generatedCodes.length === 0}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          {savingCodes ? 'Saving...' : 'Save to Database'}
                        </button>
                        <button
                          onClick={handleExportCodes}
                          disabled={generatedCodes.length === 0}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          Export to Excel
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto overflow-y-auto max-h-[40vh] border border-gray-300 rounded-md bg-white">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                          <tr>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {generatedCodes.map((code, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{index + 1}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 text-center">{code}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex-1 min-h-0 flex flex-col">
              {loadingCodes ? (
                <div className="text-center py-8 text-gray-600">Loading codes...</div>
              ) : (
                <>
                  <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Code
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Used At
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAccessCodes.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-600">
                              No codes found.
                            </td>
                          </tr>
                        ) : (
                          paginatedAccessCodes.map((code) => (
                            <tr key={code.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 text-center">
                                {code.code}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                {isAccessCodeEffectivelyUsed(code) ? (
                                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                    Used
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                    Available
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                {code.email || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                {new Date(code.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                {code.used_at ? new Date(code.used_at).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() => handleToggleCodeStatus(code.id, code.used)}
                                    disabled={editingCodeId === code.id}
                                    className="p-2 rounded-md bg-[#c8102e] text-white hover:bg-[#e63946] hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#c8102e] disabled:hover:scale-100 transition-all"
                                    title={code.used ? 'Mark as unused' : 'Mark as used'}
                                  >
                                    {editingCodeId === code.id ? (
                                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                      </svg>
                                    ) : code.used ? (
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                      </svg>
                                    ) : (
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCode(code.id, code.code)}
                                    disabled={editingCodeId === code.id}
                                    className="p-2 rounded-md bg-[#c8102e] text-white hover:bg-[#e63946] hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#c8102e] disabled:hover:scale-100 transition-all"
                                    title="Delete code"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Code Manager pagination */}
                  {filteredAccessCodes.length > 0 && (
                    <div className="mt-4 flex items-center justify-between flex-shrink-0 border-t pt-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">Show:</span>
                        <select
                          value={codeManagerItemsPerPage}
                          onChange={(e) => {
                            setCodeManagerItemsPerPage(Number(e.target.value))
                            setCodeManagerPage(1)
                          }}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-[#c8102e] focus:border-transparent"
                        >
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                        <span className="text-sm text-gray-700">per page</span>
                      </div>
                      <div className="flex-1 text-center">
                        <span className="text-sm text-gray-700">
                          Showing {codeManagerStartIndex + 1} to {Math.min(codeManagerEndIndex, filteredAccessCodes.length)} of {filteredAccessCodes.length} codes
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setCodeManagerPage(1)}
                          disabled={codeManagerPage === 1}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                          title="First page"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setCodeManagerPage(prev => Math.max(1, prev - 1))}
                          disabled={codeManagerPage === 1}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                          title="Previous page"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <span className="px-3 py-1 text-sm text-gray-700">
                          Page {codeManagerPage} of {codeManagerTotalPages}
                        </span>
                        <button
                          onClick={() => setCodeManagerPage(prev => Math.min(codeManagerTotalPages, prev + 1))}
                          disabled={codeManagerPage === codeManagerTotalPages}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                          title="Next page"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setCodeManagerPage(codeManagerTotalPages)}
                          disabled={codeManagerPage === codeManagerTotalPages}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                          title="Last page"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Code Assignments Modal */}
      {showCodeAssignmentsModal && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowCodeAssignmentsModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 max-w-5xl w-full mx-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b pb-4 mb-4 flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-900">Code Assignments</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadAssignmentsTemplate}
                  className="p-2 rounded-md bg-[#c8102e] text-white hover:bg-[#e63946] hover:scale-110 transition-all"
                  title="Download template with email, code, name columns"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleExportCodeAssignments}
                  disabled={loadingAssignments || filteredAssignments.length === 0}
                  className="p-2 rounded-md bg-[#c8102e] text-white hover:bg-[#e63946] hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
                  title="Export assignments to Excel (email, code, name, uploaded; respects current search)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </button>
                <label className={`p-2 rounded-md cursor-pointer transition-all flex-shrink-0 ${uploadingAssignments ? 'bg-[#c8102e] text-white opacity-50 cursor-not-allowed' : 'bg-[#c8102e] text-white hover:bg-[#e63946] hover:scale-110'}`} title="Upload CSV/Excel">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleUploadAssignments}
                    disabled={uploadingAssignments}
                    className="hidden"
                  />
                  {uploadingAssignments ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  )}
                </label>
                <button
                  onClick={loadCodeAssignments}
                  disabled={loadingAssignments}
                  className="p-2 rounded-md bg-[#c8102e] text-white hover:bg-[#e63946] hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#c8102e] disabled:hover:scale-100 transition-all"
                  title="Refresh assignments"
                >
                  {loadingAssignments ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => setShowCodeAssignmentsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            {assignmentMessage && (
              <div className={`mb-4 px-4 py-2 rounded-md text-sm ${assignmentMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {assignmentMessage.message}
              </div>
            )}
            <div className="mb-4 flex-shrink-0">
              <input
                type="search"
                placeholder="Search by name, email, or code..."
                value={assignmentSearchQuery}
                onChange={(e) => setAssignmentSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#c8102e] focus:border-transparent"
              />
            </div>
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {loadingAssignments ? (
                <div className="text-center py-8 text-gray-600">Loading assignments...</div>
              ) : (
                <>
                  <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
                    {(() => {
                      const totalFiltered = filteredAssignments.length
                      const assignmentTotalPages = Math.max(1, Math.ceil(totalFiltered / assignmentPageSize))
                      const assignmentStartIndex = (assignmentPage - 1) * assignmentPageSize
                      const assignmentEndIndex = assignmentStartIndex + assignmentPageSize
                      const paginatedAssignments = filteredAssignments.slice(assignmentStartIndex, assignmentEndIndex)
                      return (
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAssignments.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-600">
                                  {codeAssignments.length === 0 ? 'No assignments yet. Upload a CSV or Excel file to get started.' : 'No matches for search.'}
                                </td>
                              </tr>
                            ) : (
                              paginatedAssignments.map((row) => (
                                <tr key={row.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{row.name || '–'}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{row.email}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 text-center">{row.code}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{new Date(row.created_at).toLocaleDateString()}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                    <a
                                      href={buildResendCodeMailto(row)}
                                      className="inline-flex p-2 rounded-md bg-[#c8102e] text-white hover:bg-[#e63946] hover:scale-110 transition-all"
                                      title="Resend code email"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                      </svg>
                                    </a>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      )
                    })()}
                  </div>
                  {(() => {
                    const totalFiltered = filteredAssignments.length
                    const assignmentTotalPages = Math.max(1, Math.ceil(totalFiltered / assignmentPageSize))
                    const assignmentStartIndex = (assignmentPage - 1) * assignmentPageSize
                    const assignmentEndIndex = assignmentStartIndex + assignmentPageSize
                    if (totalFiltered === 0) return null
                    return (
                      <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 flex-shrink-0">
                        <div className="flex gap-1">
                          <button
                            onClick={() => setAssignmentPage(1)}
                            disabled={assignmentPage === 1}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                            title="First page"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setAssignmentPage(prev => Math.max(1, prev - 1))}
                            disabled={assignmentPage === 1}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                            title="Previous page"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <span className="px-3 py-1 text-sm text-gray-700">
                            Page {assignmentPage} of {assignmentTotalPages}
                          </span>
                          <button
                            onClick={() => setAssignmentPage(prev => Math.min(assignmentTotalPages, prev + 1))}
                            disabled={assignmentPage === assignmentTotalPages}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                            title="Next page"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setAssignmentPage(assignmentTotalPages)}
                            disabled={assignmentPage === assignmentTotalPages}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                            title="Last page"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                        <span className="text-sm text-gray-700">
                          Showing {assignmentStartIndex + 1} to {Math.min(assignmentEndIndex, totalFiltered)} of {totalFiltered} assignments
                        </span>
                      </div>
                    )
                  })()}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Code Save Message Modal */}
      {codeMessage && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="mb-4">
              {codeMessage.type === 'success' ? (
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Success</h2>
                </div>
              ) : (
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Error</h2>
                </div>
              )}
            </div>
            <p className={`mb-6 ${codeMessage.type === 'success' ? 'text-gray-600' : 'text-red-600'}`}>
              {codeMessage.message}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setCodeMessage(null)}
                className="px-4 py-2 text-white rounded-md hover:opacity-90"
                style={{ backgroundColor: '#c8102e' }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export confirm: Yes marks Pending orders as Fulfillment after the workbook downloads. */}
      {showExportConfirm && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => !exportLoading && setShowExportConfirm(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Export Orders</h2>
            <p className="text-gray-600 mb-6">
              Do you want to update the status of these {orders.filter((o) => (o.status || 'Pending') === 'Pending').length} order(s) to Fulfillment after download?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => exportCadetWorkbook(false)}
                disabled={exportLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                No
              </button>
              <button
                onClick={() => exportCadetWorkbook(true)}
                disabled={exportLoading}
                className="flex-1 px-4 py-2 text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#c8102e' }}
              >
                Yes
              </button>
            </div>
            <button
              onClick={() => setShowExportConfirm(false)}
              disabled={exportLoading}
              className="mt-4 w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Products Popup Modal */}
      {showProductsPopup && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                <p className="text-sm text-gray-600 mt-1">Program: {showProductsPopup.program}</p>
              </div>
              <button
                onClick={() => setShowProductsPopup(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Contact and kit info (code, name, email, t-shirt size) */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-1">
              {showProductsPopup.code != null && showProductsPopup.code !== '' && (
                <p className="text-sm text-gray-900"><span className="font-medium">Code:</span> <span className="font-mono">{showProductsPopup.code}</span></p>
              )}
              {showProductsPopup.first_name != null && showProductsPopup.last_name != null && (
                <p className="text-sm text-gray-900"><span className="font-medium">Name:</span> {showProductsPopup.first_name} {showProductsPopup.last_name}</p>
              )}
              {showProductsPopup.email != null && showProductsPopup.email !== '' && (
                <p className="text-sm text-gray-900"><span className="font-medium">Email:</span> {showProductsPopup.email}</p>
              )}
              {showProductsPopup.tshirt_size != null && showProductsPopup.tshirt_size !== '' && (
                <p className="text-sm text-gray-900"><span className="font-medium">T-Shirt Size:</span> {showProductsPopup.tshirt_size}</p>
              )}
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Products Ordered</h3>
            <p className="text-xs text-gray-500 mb-2">Each order includes 1 t-shirt, 1 backpack, 1 lanyard, and 1 pen.</p>
            <div className="space-y-2">
              {showProductsPopup.items.map((item, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-md">
                  <div className="font-medium text-gray-900">{item.product_name}</div>
                  <div className="text-sm text-gray-600">Qty: 1</div>
                  {item.customer_item_number && (
                    <div className="text-sm text-gray-600">SKU: {item.customer_item_number}</div>
                  )}
                  {item.color && (
                    <div className="text-sm text-gray-600">Color: {item.color}</div>
                  )}
                  {item.size && (
                    <div className="text-sm text-gray-600">Size: {item.size}</div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowProductsPopup(null)}
                className="px-4 py-2 text-white rounded-md hover:opacity-90"
                style={{ backgroundColor: '#c8102e' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {showBulkEdit && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Bulk Edit {selectedOrders.size} Order(s)
            </h2>
            {!bulkAction ? (
              <>
                <p className="text-gray-600 mb-6">What would you like to do with the selected orders?</p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setBulkAction('status')}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-left"
                  >
                    Update Status
                  </button>
                  <button
                    onClick={() => setBulkAction('cancel')}
                    className="px-4 py-2 border border-gray-300 rounded-md text-red-700 hover:bg-red-50 text-left"
                  >
                    Cancel Orders
                  </button>
                </div>
                <div className="mt-6 flex justify-end gap-4">
                  <button
                    onClick={() => {
                      setShowBulkEdit(false)
                      setBulkAction(null)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : bulkAction === 'status' ? (
              <>
                <p className="text-gray-600 mb-4">Select new status for {selectedOrders.size} order(s):</p>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value as typeof bulkStatus)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c8102e] focus:border-transparent mb-6"
                >
                  <option value="Pending">Pending</option>
                  <option value="Backorder">Backorder</option>
                  <option value="Fulfillment">Fulfillment</option>
                  <option value="Delivered">Delivered</option>
                </select>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => {
                      setBulkAction(null)
                      setBulkStatus('Pending')
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const orderIds = Array.from(selectedOrders)
                        if (orderIds.length === 0) {
                          alert('No orders selected')
                          return
                        }
                        
                        console.log('Updating orders:', orderIds, 'to status:', bulkStatus)
                        
                        const { data, error } = await supabase
                          .from('ra_cadet_orders')
                          .update({ status: bulkStatus })
                          .in('id', orderIds)
                          .select()
                        
                        if (error) {
                          console.error('Supabase error:', error)
                          throw error
                        }
                        
                        console.log('Update result:', data)
                        
                        if (data && data.length > 0) {
                          await loadOrders()
                          setSelectedOrders(new Set())
                          setShowBulkEdit(false)
                          setBulkAction(null)
                          setBulkStatus('Pending')
                          alert(`Successfully updated ${data.length} order(s) to ${bulkStatus}`)
                        } else {
                          alert('No orders were updated. Please check your selection.')
                        }
                      } catch (err: any) {
                        console.error('Failed to update status:', err)
                        alert(`Failed to update status: ${err.message || 'Unknown error'}`)
                      }
                    }}
                    className="px-4 py-2 text-white rounded-md hover:opacity-90"
                    style={{ backgroundColor: '#c8102e' }}
                  >
                    Update Status
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-red-600 mb-6">
                  Are you sure you want to cancel {selectedOrders.size} order(s)? This will restore inventory and cannot be undone.
                </p>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => {
                      setBulkAction(null)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        // Cancel each selected order; restore inventory then delete
                        for (const orderId of Array.from(selectedOrders)) {
                          const order = orders.find(o => o.id === orderId)
                          if (!order) continue
                          const toRestore = getRestoreListFromOrderItems(order.items)
                          for (const { productId, size } of toRestore) {
                            await restoreInventory(productId, size, 1)
                          }
                          
                          // Mark code as unused
                          const { data: accessCode } = await supabase
                            .from('ra_cadet_access_codes')
                            .select('id')
                            .eq('code', order.code)
                            .single()
                          
                          if (accessCode) {
                            await supabase
                              .from('ra_cadet_access_codes')
                              .update({
                                used: false,
                                used_at: null,
                                order_id: null,
                                email: null
                              })
                              .eq('id', accessCode.id)
                          }
                          
                          // Delete the order
                          await supabase
                            .from('ra_cadet_orders')
                            .delete()
                            .eq('id', orderId)
                        }
                        
                        await loadOrders()
                        setSelectedOrders(new Set())
                        setShowBulkEdit(false)
                        setBulkAction(null)
                      } catch (err: any) {
                        console.error('Failed to cancel orders:', err)
                        alert(`Failed to cancel orders: ${err.message || 'Unknown error'}`)
                      }
                    }}
                    className="px-4 py-2 text-white rounded-md hover:opacity-90"
                    style={{ backgroundColor: '#c8102e' }}
                  >
                    Yes, Cancel Orders
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {(confirmCancel || cancelMessage) && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            {cancelMessage ? (
              // Success/Error Message
              <>
                <div className="mb-4">
                  {cancelMessage.type === 'success' ? (
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">Order Canceled</h2>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">Error</h2>
                    </div>
                  )}
                </div>
                <p className={`mb-6 ${cancelMessage.type === 'success' ? 'text-gray-600' : 'text-red-600'}`}>
                  {cancelMessage.message}
                </p>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setCancelMessage(null)
                      setConfirmCancel(null)
                    }}
                    className="px-4 py-2 text-white rounded-md hover:opacity-90"
                    style={{ backgroundColor: '#c8102e' }}
                  >
                    OK
                  </button>
                </div>
              </>
            ) : confirmCancel ? (
              // Confirmation Dialog
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Cancel Order?</h2>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to cancel order <strong>{confirmCancel.orderNumber}</strong>? 
                  This will restore inventory and cannot be undone.
                </p>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setConfirmCancel(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    disabled={cancelingOrderId !== null}
                  >
                    No, Keep Order
                  </button>
                  <button
                    onClick={() => handleCancelOrder(confirmCancel.orderId)}
                    disabled={cancelingOrderId !== null}
                    className="px-4 py-2 text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#c8102e' }}
                  >
                    {cancelingOrderId === confirmCancel.orderId ? 'Canceling...' : 'Yes, Cancel Order'}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

