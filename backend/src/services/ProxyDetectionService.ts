import { ProxyModel } from '../models/ProxyModel';
import { LocationData, ProxyActivityType } from '../types';

export class ProxyDetectionService {

  /**
   * Evaluates an attendance attempt and logs proxy risks if thresholds are crossed
   */
  static async evaluateAttempt(params: {
    studentId: number;
    confidenceScore: number;
    locationData?: LocationData;
    authZoneLat?: number;
    authZoneLng?: number;
  }): Promise<void> {

    // 1. Face Match Confidence
    if (params.confidenceScore < 60) {
      await this.logProxyRisk(params.studentId, 'FACE_MISMATCH', 'HIGH', {
        confidence: params.confidenceScore
      });
    } else if (params.confidenceScore < 75) {
      await this.logProxyRisk(params.studentId, 'FACE_MISMATCH', 'MEDIUM', {
        confidence: params.confidenceScore
      });
    }

    // 2. Geolocation Analysis (using Haversine Formula for distance)
    if (params.locationData && params.authZoneLat && params.authZoneLng) {
      const distanceMeters = this.calculateDistance(
        params.locationData.lat, params.locationData.lng,
        params.authZoneLat, params.authZoneLng
      );

      if (distanceMeters > 500) {
        await this.logProxyRisk(params.studentId, 'LOCATION_MISMATCH', 'HIGH', {
          distanceMeters, lat: params.locationData.lat, lng: params.locationData.lng
        });
      } else if (distanceMeters > 200) {
        await this.logProxyRisk(params.studentId, 'LOCATION_MISMATCH', 'MEDIUM', {
          distanceMeters
        });
      }
    }
  }

  /**
   * Logs a risk directly into PROXY_DETECTION_LOGS table
   * Oracle Triggers will automatically escalate this to HIGH if multiple violations occur
   */
  // static async logProxyRisk(
  //   studentId: number, 
  //   activityType: string, 
  //   riskLevel: 'LOW' | 'MEDIUM' | 'HIGH', 
  //   evidenceData: any
  // ): Promise<void> {
  //   const sql = `
  //     INSERT INTO PROXY_DETECTION_LOGS (
  //       Student_ID, Activity_Type, Risk_Level, Evidence
  //     ) VALUES (
  //       :studentId, :activityType, :riskLevel, :evidence
  //     )
  //   `;
  //   await execute(sql, {
  //     studentId,
  //     activityType,
  //     riskLevel,
  //     evidence: JSON.stringify(evidenceData)
  //   });
  static async logProxyRisk(
    studentId: number,
    activityType: ProxyActivityType,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH',
    evidenceData: any
  ): Promise<void> {
    await ProxyModel.log({
      studentId,
      activityType,
      riskLevel,
      evidence: JSON.stringify(evidenceData)
    });

    if (riskLevel === 'HIGH') {
      console.warn(`[PROXY DETECTED] High risk for student ${studentId}: ${activityType}`);
    }
  }

  /**
   * Haversine formula to calculate meters between two coordinates
   */
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
