import { FaSearch } from "react-icons/fa";

const SearchBar = () => {
  return (
    <form className="d-flex" role="search">
      <div className="input-group">

        <span className="input-group-text bg-white border-end-0">
          <FaSearch />
        </span>

        <input
          type="search"
          className="form-control border-start-0"
          placeholder="Search products..."
        />

      </div>
    </form>
  );
};

export default SearchBar;