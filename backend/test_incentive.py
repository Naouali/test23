#!/usr/bin/env python3
"""
Test script to verify the incentive calculation logic
"""

def calculate_incentive_cf(asset_manager, cash_flow_percentage):
    """
    Calculate Incentive % CF based on the formula:
    =IF(F13="lezama", IF(I13<0.6, 0, I13), IF(I13<0.8, 0, I13))
    """
    if asset_manager.lower() == "lezama":
        # Special case for "lezama" - 60% threshold
        if cash_flow_percentage >= 60:
            return cash_flow_percentage
        else:
            return 0
    else:
        # For all other Asset Managers - 80% threshold
        if cash_flow_percentage >= 80:
            return cash_flow_percentage
        else:
            return 0

def test_incentive_calculations():
    """Test various scenarios for incentive calculations"""
    
    test_cases = [
        # Asset Manager, CF %, Expected Result
        ("lezama", 50, 0),      # Below 60% threshold
        ("lezama", 60, 60),     # At 60% threshold
        ("lezama", 75, 75),     # Above 60% threshold
        ("lezama", 100, 100),   # At 100%
        
        ("john_doe", 70, 0),    # Below 80% threshold
        ("john_doe", 80, 80),   # At 80% threshold
        ("john_doe", 90, 90),   # Above 80% threshold
        ("john_doe", 100, 100), # At 100%
        
        ("jane_smith", 75, 0),  # Below 80% threshold
        ("jane_smith", 85, 85), # Above 80% threshold
    ]
    
    print("Testing Incentive % CF Calculations:")
    print("=" * 50)
    print(f"{'Asset Manager':<15} {'CF %':<8} {'Expected':<10} {'Actual':<10} {'Status'}")
    print("-" * 50)
    
    all_passed = True
    
    for asset_manager, cf_percentage, expected in test_cases:
        actual = calculate_incentive_cf(asset_manager, cf_percentage)
        status = "✓ PASS" if actual == expected else "✗ FAIL"
        if actual != expected:
            all_passed = False
            
        print(f"{asset_manager:<15} {cf_percentage:<8} {expected:<10} {actual:<10} {status}")
    
    print("-" * 50)
    if all_passed:
        print("🎉 All tests passed!")
    else:
        print("❌ Some tests failed!")
    
    return all_passed

if __name__ == "__main__":
    test_incentive_calculations() 