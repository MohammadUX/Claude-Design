import { createContext, useContext } from 'react'

type Close = (after?: () => void) => void

export const OverlayContext = createContext<Close>((after) => after?.())

/** Animated close of the nearest pop-up; pass the save/confirm action to run once it has eased out. */
export const useOverlayClose = () => useContext(OverlayContext)
