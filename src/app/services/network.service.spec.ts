import { TestBed } from '@angular/core/testing';
import { NetworkService } from './network.service';

describe('NetworkService', () => {
  let service: NetworkService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NetworkService]
    });
    
    service = TestBed.inject(NetworkService);
  });

  describe('getCurrentStatus', () => {
    it('should return network status', () => {
      const status = service.getCurrentStatus();

      expect(status).toBeDefined();
      expect(status.connected).toBeDefined();
      expect(status.connectionType).toBeDefined();
    });
  });

  describe('isCurrentlyOnline', () => {
    it('should return online status', () => {
      const isOnline = service.isCurrentlyOnline();

      expect(typeof isOnline).toBe('boolean');
    });
  });

  describe('checkConnectivity', () => {
    it('should check connectivity and return boolean', async () => {
      const isConnected = await service.checkConnectivity();
      expect(typeof isConnected).toBe('boolean');
    });
  });

  describe('getNetworkInfo', () => {
    it('should get network information', async () => {
      const networkInfo = await service.getNetworkInfo();

      expect(networkInfo).toBeDefined();
      expect(networkInfo.connected).toBeDefined();
    });
  });
});
