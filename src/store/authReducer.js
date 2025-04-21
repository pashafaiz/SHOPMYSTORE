const initialState = {
    token: null,
    initialRoute: 'Login',
  };
  
  const authReducer = (state = initialState, action) => {
    switch (action.type) {
      case 'SET_TOKEN':
        return { ...state, token: action.payload };
      case 'SET_INITIAL_ROUTE':
        return { ...state, initialRoute: action.payload };
      default:
        return state;
    }
  };
  
  export default authReducer;