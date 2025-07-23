const PoweredByYou = ({
  children = "Powered by You",
}: {
  children?: React.ReactNode;
}) => {
  return (
    <div className="bg-white drop-shadow-md rounded-full inline-block px-4 py-2 border border-[#8D83FF]">
      {children}
    </div>
  );
};

export default PoweredByYou;
