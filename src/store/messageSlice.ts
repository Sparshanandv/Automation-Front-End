import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getMessageByKey } from '../services/message.service'
import { MessageState } from '../types/message.types'

interface MessagesStoreState {
  messages: Record<string, MessageState>
}

const initialState: MessagesStoreState = {
  messages: {},
}

export const fetchMessage = createAsyncThunk(
  'message/fetchMessage',
  async (key: string, { rejectWithValue }) => {
    try {
      const response = await getMessageByKey(key)
      return { key, content: response.data.content }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } }; message?: string })
        ?.response?.data?.message ?? (err as Error).message ?? 'Failed to load message'
      return rejectWithValue({ key, error: message })
    }
  }
)

const messageSlice = createSlice({
  name: 'message',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessage.pending, (state, action) => {
        const key = action.meta.arg
        state.messages[key] = { content: null, loading: true, error: null }
      })
      .addCase(fetchMessage.fulfilled, (state, action) => {
        const { key, content } = action.payload
        state.messages[key] = { content, loading: false, error: null }
      })
      .addCase(fetchMessage.rejected, (state, action) => {
        const { key, error } = action.payload as { key: string; error: string }
        state.messages[key] = { content: null, loading: false, error }
      })
  },
})

export const selectMessageByKey = (key: string) => (state: { message: MessagesStoreState }) =>
  state.message.messages[key] ?? { content: null, loading: false, error: null }

export default messageSlice.reducer
