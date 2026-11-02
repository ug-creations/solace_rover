import React from "react";

function Status({ data }) {
  return (
    <div className="mt-9 flex p-5 pr-10 flex-col rounded border-r justify-between text-white">
      <div className="flex-1 flex flex-col gap-5 p-2 items-center justify-center text-white">
        <div className="gap-5 flex flex-col">
          {/* Humidity */}
          <div className="flex items-center">
            <div className="w-[200px]">
              <h2>Humidity :</h2>
            </div>

            <div className="text-green-500 flex flex-row">
              <span>{data?.humidity ?? "--"}%</span>
            </div>
          </div>

          {/* Smoke */}
          <div className="flex items-center">
            <div className="w-[200px]">
              <h2>Smoke :</h2>
            </div>

            <div
              className={
                data?.smoke
                  ? "text-red-500 flex flex-row"
                  : "text-green-500 flex flex-row"
              }
            >
              <span>{data?.smoke ? "detected" : "not detected"}</span>
            </div>
          </div>

          {/* Temperature */}
          <div className="flex items-center">
            <div className="w-[200px]">
              <h2>Temperature :</h2>
            </div>

            <div className="text-green-500">
              <span>{data?.temperature ?? "--"}°C</span>
            </div>
          </div>

          {/* Vibration */}
          <div className="flex items-center">
            <div className="w-[200px]">
              <h2>Vibration :</h2>
            </div>

            <div
              className={data?.vibration ? "text-red-500" : "text-green-500"}
            >
              <span>{data?.vibration ? "detected" : "none"}</span>
            </div>
          </div>

          {/* Obstacles */}
          {/* Obstacles */}
          <div className="flex items-center">
            <div className="w-[200px]">
              <h2>Obstacles :</h2>
            </div>

            <div
              className={
                data?.obstacles && Object.values(data.obstacles).some(Boolean)
                  ? "text-red-500"
                  : "text-green-500"
              }
            >
              <span>
                {data?.obstacles
                  ? Object.values(data.obstacles).some(Boolean)
                    ? "detected"
                    : "not found"
                  : "--"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Status;
