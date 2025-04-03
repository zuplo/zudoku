import { SVGProps } from "react";

const SvgComponent = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={160}
    viewBox="0 0 196 36"
    fill="none"
    {...props}
  >
    <g filter="url(#a)">
      <rect
        width={192}
        height={32}
        x={2}
        y={1}
        fill="#000"
        fillOpacity={0.8}
        rx={16}
      />
      <rect
        width={191}
        height={31}
        x={2.5}
        y={1.5}
        stroke="#18181B"
        rx={15.5}
      />
      <path
        fill="#fff"
        fillRule="evenodd"
        d="M26.815 9.474A.746.746 0 0 1 27.512 9h5.448a1.5 1.5 0 0 1 1.431 1.947l-1.727 5.527a.75.75 0 0 1-.715.526H26c-.828 0-1.25.75-1.5 1.5-.206.618-1.771 4.634-2.315 6.026a.746.746 0 0 1-.697.474H16.04a1.5 1.5 0 0 1-1.431-1.947l1.726-5.527a.75.75 0 0 1 .716-.526H23c.828 0 1.25-.75 1.5-1.5.206-.618 1.771-4.634 2.315-6.026Z"
        clipRule="evenodd"
      />
      <path
        fill="#fff"
        d="M27.366 18.25a1.25 1.25 0 0 0-1.17.811l-1.974 5.263a.5.5 0 0 0 .468.676h5.893a2 2 0 0 0 1.872-1.298l1.412-3.763a1.25 1.25 0 0 0-1.17-1.689h-5.33ZM18.667 9a2 2 0 0 0-1.872 1.298l-1.412 3.763a1.25 1.25 0 0 0 1.17 1.689h5.33a1.25 1.25 0 0 0 1.171-.811l1.974-5.263A.5.5 0 0 0 24.56 9h-5.893Z"
      />
      <path
        fill="#F9FAFB"
        d="M44.004 22V11.818h3.818c.783 0 1.439.146 1.97.438.533.291.935.692 1.207 1.203.275.507.413 1.084.413 1.73 0 .653-.138 1.233-.413 1.74a2.948 2.948 0 0 1-1.218 1.198c-.537.289-1.198.433-1.983.433h-2.531v-1.517h2.282c.457 0 .832-.08 1.124-.238.291-.16.507-.378.646-.657.142-.278.214-.598.214-.96 0-.36-.072-.679-.214-.954a1.453 1.453 0 0 0-.651-.641c-.292-.156-.668-.234-1.129-.234h-1.69V22h-1.845Zm12.402.15c-.746 0-1.392-.165-1.939-.493a3.343 3.343 0 0 1-1.273-1.377c-.298-.59-.447-1.28-.447-2.068 0-.79.15-1.48.447-2.073a3.335 3.335 0 0 1 1.273-1.383c.547-.328 1.193-.492 1.94-.492.745 0 1.391.164 1.938.492.547.329.97.79 1.268 1.383.301.593.452 1.284.452 2.073 0 .788-.15 1.478-.452 2.068a3.309 3.309 0 0 1-1.268 1.377c-.547.328-1.193.492-1.939.492Zm.01-1.443c.404 0 .742-.11 1.014-.333.272-.225.474-.527.607-.904.136-.378.204-.8.204-1.263 0-.468-.068-.89-.204-1.268a2.007 2.007 0 0 0-.607-.91c-.272-.225-.61-.338-1.014-.338-.414 0-.759.113-1.034.338a2.041 2.041 0 0 0-.612.91 3.81 3.81 0 0 0-.198 1.268c0 .464.066.885.198 1.262.136.378.34.68.612.905.275.222.62.333 1.034.333ZM63.2 22l-2.158-7.636h1.835l1.342 5.369h.07l1.372-5.37h1.814l1.373 5.34h.074l1.323-5.34h1.84L69.921 22h-1.875l-1.432-5.16h-.104L65.079 22H63.2Zm13.553.15c-.766 0-1.427-.16-1.984-.478a3.233 3.233 0 0 1-1.278-1.362c-.298-.59-.447-1.285-.447-2.083 0-.786.149-1.475.447-2.069a3.384 3.384 0 0 1 1.263-1.392c.54-.334 1.175-.502 1.904-.502.47 0 .915.076 1.333.229.42.149.792.381 1.113.696.325.315.58.716.766 1.203.185.484.278 1.06.278 1.73v.552H73.89v-1.213h4.534a1.936 1.936 0 0 0-.224-.92 1.626 1.626 0 0 0-.611-.641 1.719 1.719 0 0 0-.905-.234c-.368 0-.691.09-.97.269a1.85 1.85 0 0 0-.65.696c-.153.285-.231.598-.234.94v1.058c0 .444.08.825.243 1.144.163.315.39.556.681.726.292.165.633.248 1.025.248.261 0 .498-.036.71-.11.213-.075.397-.186.552-.332.156-.146.274-.327.353-.542l1.68.189a2.622 2.622 0 0 1-.606 1.163 2.958 2.958 0 0 1-1.133.766c-.461.179-.988.268-1.581.268ZM81.92 22v-7.636h1.745v1.272h.08c.139-.44.377-.78.715-1.019a1.97 1.97 0 0 1 1.169-.363c.099 0 .21.005.333.015.126.007.23.018.313.035v1.655a1.894 1.894 0 0 0-.363-.07 3.34 3.34 0 0 0-.472-.034 1.82 1.82 0 0 0-.885.214c-.259.14-.463.333-.612.582a1.64 1.64 0 0 0-.224.86V22h-1.8Zm8.867.15c-.766 0-1.427-.16-1.984-.478a3.233 3.233 0 0 1-1.278-1.362c-.298-.59-.447-1.285-.447-2.083 0-.786.15-1.475.448-2.069a3.384 3.384 0 0 1 1.262-1.392c.54-.334 1.175-.502 1.904-.502.471 0 .915.076 1.333.229.42.149.792.381 1.113.696.325.315.58.716.766 1.203.186.484.278 1.06.278 1.73v.552h-6.259v-1.213h4.534a1.936 1.936 0 0 0-.223-.92 1.626 1.626 0 0 0-.612-.641 1.719 1.719 0 0 0-.905-.234c-.368 0-.69.09-.97.269a1.848 1.848 0 0 0-.65.696c-.153.285-.23.598-.234.94v1.058c0 .444.081.825.243 1.144.163.315.39.556.681.726.292.165.634.248 1.025.248.261 0 .498-.036.71-.11.213-.075.397-.186.553-.332.155-.146.273-.327.352-.542l1.68.189a2.62 2.62 0 0 1-.606 1.163 2.958 2.958 0 0 1-1.133.766c-.46.179-.988.268-1.581.268Zm8.002-.016a2.89 2.89 0 0 1-1.611-.462c-.474-.308-.849-.756-1.124-1.343-.275-.586-.412-1.299-.412-2.137 0-.849.139-1.565.417-2.148.282-.587.662-1.03 1.139-1.327a2.926 2.926 0 0 1 1.596-.453c.447 0 .815.076 1.103.229.289.149.517.33.687.542.169.209.299.406.392.591h.075v-3.808h1.805V22h-1.77v-1.203h-.11a3.109 3.109 0 0 1-.402.591 2.221 2.221 0 0 1-.696.527c-.289.146-.652.22-1.09.22Zm.502-1.476c.381 0 .706-.103.974-.309.269-.208.473-.498.612-.87.139-.37.209-.803.209-1.297 0-.494-.07-.923-.209-1.288-.136-.364-.338-.648-.607-.85-.265-.202-.591-.303-.98-.303-.4 0-.735.104-1.003.313-.269.209-.471.497-.607.865a3.63 3.63 0 0 0-.204 1.263c0 .477.068.903.204 1.277.14.372.343.665.612.88.271.213.604.319.999.319ZM108.827 22V11.818h1.799v3.808h.075c.093-.185.224-.382.393-.591.169-.212.397-.393.686-.542.288-.153.656-.229 1.103-.229.59 0 1.122.151 1.596.453.477.298.855.74 1.134 1.327.281.583.422 1.3.422 2.148 0 .838-.137 1.55-.412 2.137-.275.587-.65 1.035-1.124 1.343a2.89 2.89 0 0 1-1.611.462c-.437 0-.8-.073-1.088-.218a2.2 2.2 0 0 1-.696-.527 3.372 3.372 0 0 1-.403-.592h-.105V22h-1.769Zm1.764-3.818c0 .494.07.926.209 1.297.143.372.347.662.612.87.268.206.593.309.974.309.398 0 .731-.106.999-.319a1.96 1.96 0 0 0 .607-.88c.139-.374.209-.8.209-1.277 0-.474-.068-.895-.204-1.263a1.894 1.894 0 0 0-.607-.865c-.268-.209-.603-.313-1.004-.313-.384 0-.711.1-.979.303-.269.202-.473.486-.612.85-.136.365-.204.794-.204 1.288Zm8.083 6.682c-.245 0-.472-.02-.681-.06a2.54 2.54 0 0 1-.492-.13l.418-1.401c.261.076.495.112.7.11a.857.857 0 0 0 .542-.195c.159-.122.294-.328.403-.616l.154-.413-2.769-7.795h1.909l1.76 5.767h.08l1.765-5.767h1.914l-3.058 8.56c-.142.405-.331.751-.567 1.04a2.297 2.297 0 0 1-.865.666c-.338.156-.742.234-1.213.234ZM129.485 22v-1.148l5.22-7.488h-5.25v-1.546h7.537v1.149l-5.215 7.487h5.245V22h-7.537Zm14.36-3.212v-4.424h1.799V22h-1.745v-1.357h-.079a2.303 2.303 0 0 1-.85 1.049c-.391.271-.874.407-1.447.407-.501 0-.943-.11-1.328-.333a2.31 2.31 0 0 1-.894-.98c-.216-.43-.324-.95-.324-1.56v-4.862h1.8v4.583c0 .484.133.869.398 1.154.265.285.613.427 1.044.427.265 0 .522-.064.771-.194.248-.129.452-.321.611-.576.162-.259.244-.582.244-.97Zm6.734 3.346a2.89 2.89 0 0 1-1.611-.462c-.474-.308-.848-.756-1.124-1.343-.275-.586-.412-1.299-.412-2.137 0-.849.139-1.565.417-2.148.282-.587.662-1.03 1.139-1.327a2.925 2.925 0 0 1 1.596-.453c.447 0 .815.076 1.104.229.288.149.517.33.686.542.169.209.3.406.392.591h.075v-3.808h1.805V22h-1.77v-1.203h-.11a3.062 3.062 0 0 1-.402.591 2.224 2.224 0 0 1-.696.527c-.289.146-.652.22-1.089.22Zm.502-1.476c.381 0 .706-.103.974-.309.269-.208.473-.498.612-.87.139-.37.209-.803.209-1.297 0-.494-.07-.923-.209-1.288-.136-.364-.338-.648-.607-.85-.265-.202-.591-.303-.979-.303-.401 0-.736.104-1.004.313a1.894 1.894 0 0 0-.607.865 3.628 3.628 0 0 0-.204 1.263c0 .477.068.903.204 1.277.139.372.343.665.612.88.271.213.605.319.999.319Zm9.063 1.491c-.745 0-1.392-.164-1.939-.492a3.343 3.343 0 0 1-1.272-1.377c-.299-.59-.448-1.28-.448-2.068 0-.79.149-1.48.448-2.073a3.335 3.335 0 0 1 1.272-1.383c.547-.328 1.194-.492 1.939-.492.746 0 1.392.164 1.939.492a3.3 3.3 0 0 1 1.268 1.383c.302.593.452 1.284.452 2.073 0 .788-.15 1.478-.452 2.068a3.308 3.308 0 0 1-1.268 1.377c-.547.328-1.193.492-1.939.492Zm.01-1.442c.405 0 .743-.11 1.015-.333.271-.225.473-.527.606-.904.136-.378.204-.8.204-1.263 0-.468-.068-.89-.204-1.268a2.015 2.015 0 0 0-.606-.91c-.272-.225-.61-.338-1.015-.338-.414 0-.759.113-1.034.338a2.04 2.04 0 0 0-.611.91 3.8 3.8 0 0 0-.199 1.268c0 .464.066.885.199 1.262.136.378.339.68.611.905.275.222.62.333 1.034.333Zm7.068-1.103-.005-2.173h.288l2.744-3.067h2.103l-3.375 3.758h-.373l-1.382 1.482ZM165.581 22V11.818h1.8V22h-1.8Zm4.793 0-2.486-3.475 1.213-1.268L172.526 22h-2.152Zm8.295-3.212v-4.424h1.8V22h-1.745v-1.357h-.08a2.297 2.297 0 0 1-.85 1.049c-.391.271-.873.407-1.447.407-.5 0-.943-.11-1.327-.333a2.313 2.313 0 0 1-.895-.98c-.216-.43-.323-.95-.323-1.56v-4.862h1.799v4.583c0 .484.133.869.398 1.154.265.285.613.427 1.044.427.265 0 .522-.064.771-.194.248-.129.452-.321.611-.576.163-.259.244-.582.244-.97Z"
      />
    </g>
    <defs>
      <filter
        id="a"
        width={196}
        height={36}
        x={0}
        y={0}
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
      >
        <feFlood floodOpacity={0} result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          result="hardAlpha"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
        />
        <feOffset dy={1} />
        <feGaussianBlur stdDeviation={1} />
        <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0" />
        <feBlend in2="BackgroundImageFix" result="effect1_dropShadow_246_277" />
        <feBlend
          in="SourceGraphic"
          in2="effect1_dropShadow_246_277"
          result="shape"
        />
      </filter>
    </defs>
  </svg>
);
export default SvgComponent;
