"""
Utility functions for government jurisdiction assignment
"""

from db.supabase import supabase
from middleware.logging import logger
import math

def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two coordinates using Haversine formula
    Returns distance in kilometers
    """
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c

def find_government_jurisdiction(latitude: float, longitude: float):
    """
    Find the government jurisdiction for a given location
    Returns jurisdiction_id or None if no match found
    """
    try:
        # Fetch all government jurisdictions
        response = supabase.table("government_jurisdictions").select("*").execute()
        
        if not response.data:
            logger.warning("No government jurisdictions found in database")
            return None
        
        jurisdictions = response.data
        
        # Find matching jurisdiction based on coordinates
        for jurisdiction in jurisdictions:
            boundary_data = jurisdiction.get("boundary_data", {})
            
            if boundary_data.get("type") == "city":
                coords = boundary_data.get("coordinates", {})
                center_lat = coords.get("lat")
                center_lng = coords.get("lng")
                radius_km = coords.get("radius_km", 50)
                
                if center_lat and center_lng:
                    distance = calculate_distance(latitude, longitude, center_lat, center_lng)
                    
                    if distance <= radius_km:
                        logger.info(f"Report location matches {jurisdiction['city_name']} jurisdiction (distance: {distance:.2f}km)")
                        return jurisdiction["id"]
        
        logger.info(f"No jurisdiction match found for location ({latitude}, {longitude})")
        return None
        
    except Exception as e:
        logger.error(f"Error finding government jurisdiction: {e}")
        return None

def get_government_reports(government_user_id: str):
    """
    Get all reports assigned to a specific government user
    """
    try:
        # First, get the jurisdiction ID for this government user
        jurisdiction_response = supabase.table("government_jurisdictions")\
            .select("id")\
            .eq("government_user_id", government_user_id)\
            .execute()
        
        if not jurisdiction_response.data:
            logger.warning(f"No jurisdiction found for government user {government_user_id}")
            return []
        
        jurisdiction_id = jurisdiction_response.data[0]["id"]
        
        # Get all reports assigned to this jurisdiction
        reports_response = supabase.table("reports")\
            .select("*, photos(url)")\
            .eq("government_id", jurisdiction_id)\
            .order("created_at", desc=True)\
            .execute()
        
        return reports_response.data
        
    except Exception as e:
        logger.error(f"Error fetching government reports: {e}")
        return []
