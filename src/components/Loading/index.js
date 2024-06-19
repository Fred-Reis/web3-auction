import BeatLoader from "react-spinners/HashLoader";

export const Loading = ({ loading }) => (
  <>
    <h1>Processing...</h1>
    <BeatLoader
      color={"#fff"}
      loading={loading}
      size={50}
      aria-label="Loading Spinner"
      data-testid="loader"
    />
  </>
);
