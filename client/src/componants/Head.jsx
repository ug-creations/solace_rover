import React from 'react'

function Head({ data }) {
  const connection = data?.connection;
  return (
          <div className="flex flex-row">
        <div className="p-5 flex flex-row gap-20 items-center  w-[1000px] h-[300px] ">
          <img
            style={{ animationDuration: "40s" }}
            className="drop-shadow-[0_0_10px_#e9ecef] animate-spin   rounded-full h-[200px] w-[200px]"
            src="https://th.bing.com/th/id/OIP.MVAbyF5qxwx0OBUf6AdktAHaHV?w=174&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3"
            alt=""
          />
          <h1 className="text-7xl font-bold font-chakra text-white ">
            SOLACE ROVER
          </h1>
        </div>
        <div className=" flex-1 flex flex-col gap-5 p-2 items-center  justify-center text-white ">
          <div className="gap-5 flex flex-col">
            <div className="flex items-center">
              <div className="w-[200px]">
                <h2>STATUS :</h2>
              </div>

              <div className="text-green-500 flex flex-row">
                        <span
          className={
            connection?.status === "ONLINE"
              ? "text-green-500"
              : "text-red-500"
          }
        >
          {connection?.status ?? "--"}
        </span>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-[200px]">
                <h2>RESPONSE :</h2>
              </div>

              <div className="text-green-500">
                
                        <span>
          {connection?.response ?? "--"}
        </span>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-[200px]">
                <h2>CONNECTIVITY :</h2>
              </div>

              <div className="text-green-500">
                        <span
          className={
            connection?.connectivity === "CONNECTED"
              ? "text-green-500"
              : "text-red-500"
          }
        >
          {connection?.connectivity ?? "--"}
        </span>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}

export default Head