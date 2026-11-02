import { useEffect, useState } from "react";
import "./App.css";
import { getRoverStatus } from "./api";
import Head from "./componants/Head.jsx";
import Host from "./componants/Host.jsx";
import Status from "./componants/Status.jsx";
import Message from "./componants/Message.jsx";
import History from "./componants/History.jsx";
import Mov from "./componants/Mov.jsx";

function App() {

  const [roverData, setData] = useState(null);

  useEffect(() => {
    const updateData = async () => {
      try {
        const roverData = await getRoverStatus();
        setData(roverData);
      } catch (error) {
        console.error("Rover connection error:", error);
      }
    };

    updateData();

    const interval = setInterval(updateData, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#000814]">

      <div className="text-white p-4 flex flex-row gap-5">
        <h1 className="text-white flex">
          overall status :
        </h1>

        <h1 className="text-white flex text-green-500/80">
          normal
        </h1>
      </div>

      <Head data={roverData} />

      <Host />

      <div className="flex flex-row gap-5 p-2">
        <div className="flex flex-col gap-5 w-1/2">

        <Status data={roverData} />

        <Message data={roverData} /></div>

        <History />

      </div>

      <Mov data={roverData} />

    </div>
  );
}

export default App;