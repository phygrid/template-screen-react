import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { connectPhyClient, PhyHubClient } from '@phygrid/hub-client';
import { getDevSettings, isDevMode } from './utils/dev-mode';
import logo from './phygrid-logo.svg';
import Settings from './schema';

interface AppState {
  client: PhyHubClient | null;
  settings: Settings | null;
  signals: PhyHubClient['signals'] | null;
}

const initialState: AppState = {
  client: null,
  settings: null,
  signals: null,
};

function App() {
  const [state, setState] = useState<AppState>(initialState);

  const initializeDevMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      settings: getDevSettings()
    }));
  }, []);

  const initializeClient = useCallback(async () => {
    try {
      const client = await connectPhyClient();
      const signals = await client.initializeSignals();
      const settings = await client.getSettings() as Settings;

      setState({ client, settings, signals });
    } catch (err) {
      console.error('Error initializing client:', err);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      if (isDevMode()) {
        initializeDevMode();
        return;
      }

      await initializeClient();
    };

    initialize();
  }, [initializeDevMode, initializeClient]);

  const handleAddToCart = useCallback(() => {
    const { signals } = state;
    if (!signals) return;
    signals.sendCartAdd({ productId: 'TEMPORARY-PRODUCT-ID-123', quantity: 1 });
  }, [state]);

  if (!state.settings) {
    return <Container>Loading gridapp settings...</Container>;
  }

  const { productName, productPrice } = state.settings;

  return (
    <Container>
      <ProductInfo>
        <Logo src={logo} alt="logo" />
        <p>Product name: {productName}</p>
        <p>Product price: {productPrice}</p>
        <StyledButton onClick={handleAddToCart}>Add to Cart</StyledButton>
      </ProductInfo>
    </Container>
  );
}

const Container = styled.div`
  text-align: center;
  background-color: #000000;
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
  align-items: center;
  justify-content: center
`;

const Logo = styled.img`
  height: 15vmin;
  pointer-events: none;
`;

const StyledButton = styled.button`
  background: linear-gradient(135deg, #1dac4d 0%, #0f7a32 100%);
  border: none;
  border-radius: 25px;
  color: white;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  padding: 24px 48px;
  margin: 20px;
`;

export default App;
