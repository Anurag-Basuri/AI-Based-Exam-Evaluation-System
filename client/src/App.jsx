import React from "react";
import AppRoutes from './routes/AppRoutes';
import Header from "./components/Header";

const App = () => {
    return (
        <>
            <Header />
            <AppRoutes />
        </>
    );
};

export default App;