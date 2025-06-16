import React, { useCallback, useEffect, useState } from "react";
import { connectPhyClient } from "@phygrid/hub-client";
import styled from "styled-components";
import logo from "./logo.svg";

import Settings from "./schema";

function App() {
  const [client, setClient] = useState<any>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [gs, setGs] = useState<any>(null);

  // Fetch & set the client, settings, and signals once.
  useEffect(() => {
    let isMounted = true;

    const initializeClient = async () => {
      try {
        const newClient = await connectPhyClient();
        console.log("client", newClient);

        if (isMounted) {
          setClient(newClient);
          const newGs = await newClient.initializeSignals();
          setGs(newGs);

          const newSettings = (await newClient.getSettings()) as Settings;
          setSettings(newSettings);
        }
      } catch (err) {
        console.error("Error initializing client:", err);
      }
    };

    initializeClient();

    return () => {
      isMounted = false;
    };
  }, []);

  // Send content view once productName is available
  useEffect(() => {
    if (!gs || !settings?.productName) return;
    gs.sendCartView();
  }, [gs, settings?.productName]);

  // Example add to cart callback:
  const onAddToCart = useCallback(() => {
    if (!gs) return;
    gs.sendCartAdd({ productId: "TEMPORARY-PRODUCT-ID-123", quantity: 1 });
  }, [gs]);

  if (!settings) {
    return <Container>Loading gridapp settings...</Container>;
  }

  const { productName, productPrice } = settings;

  return (
    <Container>
      <ProductInfo>
        <Logo src={logo} alt="logo" />
        <p>Product name: {productName}</p>
        <p>Product price: {productPrice}</p>
        <button onClick={onAddToCart}>Add to Cart</button>
      </ProductInfo>
    </Container>
  );
}

const Container = styled.div`
  text-align: center;
  background-color: #282c34;
  height: 100%;
  position: absolute;
  display: flex;
  flex-direction: row;
  width: 100%;
  color: white;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 1.5vmin);
`;

const ProductInfo = styled.header`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding-bottom: 64px;
  border-right: solid 1px white;
`;

const Logo = styled.img`
  height: 40vmin;
  pointer-events: none;
`;

export default App;
