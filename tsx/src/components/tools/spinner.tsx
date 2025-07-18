interface Props {
  color?: string;
  type?: "spin" | "dots";
  size?: string;
}

export const Spinner = ({
  color = "white",
  type = "dots",
  size = "35",
}: Props) => {
  let loader: React.ReactNode = <></>;

  switch (type) {
    case "dots":
      loader = (
        <svg
          fill={color}
          height={size}
          width={size}
          version="1.1"
          id="Layer_1"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 210 210"
          xmlSpace="preserve"
          className="animate-caret-blink"
        >
          <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
          <g
            id="SVGRepo_tracerCarrier"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></g>
          <g id="SVGRepo_iconCarrier">
            <g id="XMLID_27_">
              <path
                id="XMLID_28_"
                d="M25,80C11.215,80,0,91.215,0,105s11.215,25,25,25c13.785,0,25-11.215,25-25S38.785,80,25,80z"
              ></path>
              <path
                id="XMLID_30_"
                d="M105,80c-13.785,0-25,11.215-25,25s11.215,25,25,25c13.785,0,25-11.215,25-25S118.785,80,105,80z"
              ></path>
              <path
                id="XMLID_71_"
                d="M185,80c-13.785,0-25,11.215-25,25s11.215,25,25,25c13.785,0,25-11.215,25-25S198.785,80,185,80z"
              ></path>
            </g>
          </g>
        </svg>
      );
      break;

    case "spin":
      loader = (
        <svg
          fill={color}
          height={size}
          width={size}
          version="1.1"
          id="Layer_1"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 330 330"
          xmlSpace="preserve"
          className="animate-spin"
        >
          <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
          <g
            id="SVGRepo_tracerCarrier"
            stroke-linecap="round"
            stroke-linejoin="round"
          ></g>
          <g id="SVGRepo_iconCarrier">
            {" "}
            <g id="XMLID_11_">
              {" "}
              <path
                id="XMLID_12_"
                d="M165,232.5c-8.284,0-15,6.716-15,15v60c0,8.284,6.716,15,15,15s15-6.716,15-15v-60 C180,239.216,173.284,232.5,165,232.5z"
              ></path>{" "}
              <path
                id="XMLID_13_"
                d="M165,7.5c-8.284,0-15,6.716-15,15v30c0,8.284,6.716,15,15,15s15-6.716,15-15v-30 C180,14.216,173.284,7.5,165,7.5z"
              ></path>{" "}
              <path
                id="XMLID_14_"
                d="M90,157.5c0-8.284-6.716-15-15-15H15c-8.284,0-15,6.716-15,15s6.716,15,15,15h60 C83.284,172.5,90,165.784,90,157.5z"
              ></path>{" "}
              <path
                id="XMLID_15_"
                d="M315,142.5h-60c-8.284,0-15,6.716-15,15s6.716,15,15,15h60c8.284,0,15-6.716,15-15S323.284,142.5,315,142.5 z"
              ></path>{" "}
              <path
                id="XMLID_16_"
                d="M90.752,210.533L48.327,252.96c-5.857,5.858-5.857,15.355,0,21.213c2.929,2.929,6.768,4.393,10.607,4.393 s7.678-1.464,10.607-4.393l42.426-42.427c5.857-5.858,5.857-15.355-0.001-21.213C106.108,204.675,96.611,204.675,90.752,210.533z"
              ></path>{" "}
              <path
                id="XMLID_17_"
                d="M228.639,108.86c3.839,0,7.678-1.464,10.606-4.394l42.426-42.427c5.858-5.858,5.858-15.355,0-21.213 c-5.857-5.857-15.355-5.858-21.213,0l-42.426,42.427c-5.858,5.858-5.858,15.355,0,21.213 C220.961,107.396,224.8,108.86,228.639,108.86z"
              ></path>{" "}
              <path
                id="XMLID_18_"
                d="M239.245,210.533c-5.856-5.857-15.355-5.858-21.213-0.001c-5.858,5.858-5.858,15.355,0,21.213 l42.426,42.427c2.929,2.929,6.768,4.393,10.607,4.393c3.838,0,7.678-1.465,10.606-4.393c5.858-5.858,5.858-15.355,0-21.213 L239.245,210.533z"
              ></path>{" "}
            </g>{" "}
          </g>
        </svg>
      );
      break;
  }

  return loader;
};
