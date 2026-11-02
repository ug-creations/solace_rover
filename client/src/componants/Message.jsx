import React from 'react'

function Message({ data }) {
  return (
    <div className="bg-[#000814] mt-2 text-white p-4 rounded">
      <h2 className="text-xl font-bold mb-2">ASSISTANT</h2>
      <p className="text-[#adb5bd] w-[300px]"> {data?.ai_message ?? "Waiting for AI observation..."}</p>
    </div>
  )
}

export default Message