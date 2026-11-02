import React from 'react'

function Mov({data}) {
  return (
    <div>
      <div className="flex flex-row text-white gap-5 mt-10">
        <h1>ROVER MOVEMENT :</h1>

        <h1>
          {data?.rover?.movement ?? "UNKNOWN"}
        </h1>
      </div>
    </div>
  )
}

export default Mov