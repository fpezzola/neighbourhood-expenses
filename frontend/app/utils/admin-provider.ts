import * as React from 'react'
import type { AddressType } from './address.js'

type AdminProviderState = {
	address: AddressType
}

const defaultState: AdminProviderState = {
	address: '0x0',
}

export const AdminContext =
	React.createContext<AdminProviderState>(defaultState)
export const AdminProvider = AdminContext.Provider
export const useAdmin = () => React.useContext(AdminContext)
