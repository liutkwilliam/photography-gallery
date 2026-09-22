import { FaAngleDoubleDown } from "react-icons/fa";

export default function ScrollIndicator() {
  return (
    <>
      {/* scoll indication */}
      <div className="absolute bottom-[10%] left-8 opacity-50">
        <p className="flex items-center gap-2 font-light text-2xl">
          <span>
            <FaAngleDoubleDown />
          </span>
          scroll down to continue
        </p>
      </div>
    </>
  );
}
