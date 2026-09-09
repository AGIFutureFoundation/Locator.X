"""
Regional Category Analysis for Locator.X

Generates:
1. Category heatmaps (by ZIP code density)
2. Clustering analysis (k-means on properties)
3. Investment cluster insights
4. Category distribution reports

Output: analysis_categories.json with heatmap data, clusters, and insights
"""

import os
import json
import math
from collections import defaultdict, Counter
from typing import List, Dict, Tuple

# Repo root from this file's own location, so a clone runs anywhere.
# LOCATOR_X_ROOT overrides it when the data tree sits outside the repo.
R = (os.environ.get('LOCATOR_X_ROOT') or os.path.dirname(os.path.abspath(__file__))).rstrip(os.sep) + os.sep

def load_listings(source='nola'):
    """
    Load listings from pool data (pre-build stage).

    Args:
        source: 'nola' or 'launi'

    Returns:
        List of property dicts with lat/lng/category/price/score
    """
    listings = []

    try:
        if source == 'nola':
            # Load from nola_pool.json (cleaned Orleans + Jefferson properties)
            pool = json.load(open(f'{R}nola_pool.json'))
            for i, p in enumerate(pool[:120000], 1):
                if not p.get('lat') or not p.get('lng'):
                    continue

                # Import and apply categorization
                from property_categories import categorize_by_kind
                category, confidence = categorize_by_kind(
                    p.get('kind'),
                    units=p.get('units'),
                    use_code=p.get('use_code')
                )

                listings.append({
                    'id': f"NO{i:06d}",
                    'lat': p['lat'],
                    'lng': p['lng'],
                    'category': category,
                    'price': p.get('price', 0),
                    'score': p.get('score', 50),
                    'zip': p.get('zip'),
                    'units': p.get('units', 1),
                })

        elif source == 'launi':
            # Load from launi_pool.json (East Baton Rouge properties)
            pool = json.load(open(f'{R}launi_pool.json'))
            for i, p in enumerate(pool[:120000], 1):
                if not p.get('lat') or not p.get('lng'):
                    continue

                from property_categories import categorize_by_kind
                # EBR doesn't have use_code yet (waiting for ebr_income.json)
                category, confidence = categorize_by_kind(
                    p.get('kind'),
                    units=p.get('units'),
                    use_code=None
                )

                # Marker size proxy for score (price-based until full scoring available)
                if p.get('price', 0) > 300000:
                    score = 75
                elif p.get('price', 0) > 150000:
                    score = 60
                else:
                    score = 45

                listings.append({
                    'id': f"LU{i:06d}",
                    'lat': p['lat'],
                    'lng': p['lng'],
                    'category': category,
                    'price': p.get('price', 0),
                    'score': score,
                    'zip': p.get('zip'),
                    'units': p.get('units', 1),
                })

    except FileNotFoundError as e:
        print(f"Warning: {source} pool file not found: {e}")
    except Exception as e:
        print(f"Error loading {source} listings: {e}")

    return listings


def aggregate_by_zip(listings: List[Dict]) -> Dict[str, Dict]:
    """Aggregate property statistics by ZIP code."""
    zip_stats = defaultdict(lambda: {
        'count': 0,
        'categories': Counter(),
        'avg_price': 0,
        'total_price': 0,
        'avg_score': 0,
        'total_score': 0,
        'avg_units': 0,
        'total_units': 0,
        'properties': [],
        'lat': 0,
        'lng': 0,
    })

    for listing in listings:
        if not listing.get('zip'):
            continue

        zip_code = str(listing['zip'])
        cat = listing.get('category', 'RESIDENTIAL')
        price = listing.get('price', 0)
        score = listing.get('score', 50)
        units = listing.get('units', 1)

        stats = zip_stats[zip_code]
        stats['count'] += 1
        stats['categories'][cat] += 1
        stats['total_price'] += price
        stats['total_score'] += score
        stats['total_units'] += units

        # Store lat/lng for cluster center calculation
        if listing.get('lat') and listing.get('lng'):
            stats['lat'] += listing['lat']
            stats['lng'] += listing['lng']
            stats['properties'].append({
                'id': listing.get('id'),
                'lat': listing['lat'],
                'lng': listing['lng'],
                'category': cat,
                'price': price,
                'score': score,
                'units': units,
            })

    # Calculate averages
    for zip_code, stats in zip_stats.items():
        if stats['count'] > 0:
            stats['avg_price'] = stats['total_price'] / stats['count']
            stats['avg_score'] = stats['total_score'] / stats['count']
            stats['avg_units'] = stats['total_units'] / stats['count']
            stats['lat'] = stats['lat'] / stats['count']
            stats['lng'] = stats['lng'] / stats['count']

    return dict(zip_stats)


def calculate_heatmap_intensity(stats: Dict, metric: str = 'count') -> float:
    """
    Calculate heatmap intensity (0-1) for a ZIP code.

    metric options:
    - 'count': property density
    - 'value': total value density
    - 'score': average investment score
    """
    if metric == 'count':
        # Normalize by max count
        return min(stats['count'] / 500, 1.0)  # Assume 500 is "hot"
    elif metric == 'value':
        # Normalize by total value
        return min(stats['total_price'] / 100_000_000, 1.0)  # $100M is "hot"
    elif metric == 'score':
        # Normalize by score (0-100)
        return stats['avg_score'] / 100
    return 0


def generate_category_heatmaps(zip_stats: Dict) -> Dict:
    """Generate heatmap data for each category."""
    categories = ['RESIDENTIAL', 'MULTI_FAMILY', 'COMMERCIAL', 'INDUSTRIAL', 'HOTEL', 'MIXED_USE', 'LAND']
    heatmaps = {}

    for category in categories:
        heatmap_data = {}
        for zip_code, stats in zip_stats.items():
            count = stats['categories'].get(category, 0)
            if count > 0:
                # Calculate intensity based on category-specific properties
                intensity = min(count / 50, 1.0) if category in ['MULTI_FAMILY', 'COMMERCIAL', 'HOTEL'] else min(count / 200, 1.0)
                heatmap_data[zip_code] = {
                    'count': count,
                    'intensity': intensity,
                    'pct_of_zip': count / stats['count'] if stats['count'] > 0 else 0,
                    'avg_price': sum(p['price'] for p in stats['properties'] if p['category'] == category) / count if count > 0 else 0,
                    'lat': stats['lat'],
                    'lng': stats['lng'],
                }

        heatmaps[category] = heatmap_data

    return heatmaps


def kmeans_clustering(properties: List[Dict], k: int = 10, max_iters: int = 20) -> List[List[Dict]]:
    """
    Simple k-means clustering on property locations.

    Args:
        properties: List of property dicts with lat/lng/category/score
        k: Number of clusters
        max_iters: Maximum iterations

    Returns:
        List of clusters (each cluster is list of properties)
    """
    if len(properties) < k:
        return [[p] for p in properties]

    # Initialize cluster centers randomly
    import random
    centers = random.sample(properties, k)
    centers = [[p['lat'], p['lng']] for p in centers]

    for iteration in range(max_iters):
        # Assign properties to nearest center
        clusters = [[] for _ in range(k)]
        for prop in properties:
            distances = [
                math.sqrt((prop['lat'] - c[0])**2 + (prop['lng'] - c[1])**2)
                for c in centers
            ]
            nearest = distances.index(min(distances))
            clusters[nearest].append(prop)

        # Update centers
        new_centers = []
        for cluster in clusters:
            if cluster:
                lat_avg = sum(p['lat'] for p in cluster) / len(cluster)
                lng_avg = sum(p['lng'] for p in cluster) / len(cluster)
                new_centers.append([lat_avg, lng_avg])
            else:
                new_centers.append(centers[len(new_centers)])

        centers = new_centers

    return clusters


def generate_cluster_insights(clusters: List[List[Dict]]) -> List[Dict]:
    """Generate insights for each cluster."""
    insights = []

    for i, cluster in enumerate(clusters):
        if not cluster:
            continue

        # Calculate cluster statistics
        avg_lat = sum(p['lat'] for p in cluster) / len(cluster)
        avg_lng = sum(p['lng'] for p in cluster) / len(cluster)
        avg_score = sum(p['score'] for p in cluster) / len(cluster)
        avg_price = sum(p['price'] for p in cluster) / len(cluster)

        # Category distribution
        categories = Counter(p['category'] for p in cluster)
        primary_category = categories.most_common(1)[0][0]

        # Property density (properties per square mile)
        # Approximate by min/max lat/lng spread
        lats = [p['lat'] for p in cluster]
        lngs = [p['lng'] for p in cluster]
        lat_range = max(lats) - min(lats) if lats else 0
        lng_range = max(lngs) - min(lngs) if lngs else 0

        # Rough approximation: 1 degree ≈ 69 miles
        area_sq_miles = max(0.01, lat_range * lng_range * 69 * 69)
        density = len(cluster) / area_sq_miles

        insights.append({
            'cluster_id': i,
            'size': len(cluster),
            'center': {'lat': round(avg_lat, 5), 'lng': round(avg_lng, 5)},
            'primary_category': primary_category,
            'category_distribution': dict(categories),
            'avg_score': round(avg_score, 1),
            'avg_price': round(avg_price, 0),
            'density_per_sq_mile': round(density, 2),
            'score_range': {
                'min': min(p['score'] for p in cluster),
                'max': max(p['score'] for p in cluster),
            },
            'top_properties': sorted(cluster, key=lambda p: p['score'], reverse=True)[:5],
        })

    # Sort by score
    insights.sort(key=lambda x: x['avg_score'], reverse=True)
    return insights


def generate_category_summary(zip_stats: Dict) -> Dict:
    """Generate summary statistics by category."""
    categories = ['RESIDENTIAL', 'MULTI_FAMILY', 'COMMERCIAL', 'INDUSTRIAL', 'HOTEL', 'MIXED_USE', 'LAND']
    summary = {}

    for category in categories:
        cat_props = []
        for stats in zip_stats.values():
            cat_props.extend([p for p in stats['properties'] if p['category'] == category])

        if cat_props:
            summary[category] = {
                'total': len(cat_props),
                'avg_price': round(sum(p['price'] for p in cat_props) / len(cat_props), 0),
                'avg_score': round(sum(p['score'] for p in cat_props) / len(cat_props), 1),
                'price_range': {
                    'min': round(min(p['price'] for p in cat_props), 0),
                    'max': round(max(p['price'] for p in cat_props), 0),
                },
                'score_range': {
                    'min': round(min(p['score'] for p in cat_props), 1),
                    'max': round(max(p['score'] for p in cat_props), 1),
                },
                'total_value': round(sum(p['price'] for p in cat_props), 0),
            }

    return summary


def main():
    print("=" * 70)
    print("Locator.X Regional Category Analysis Generator")
    print("=" * 70)
    print()

    analysis = {
        'generated': '2026-09-07',
        'regions': {},
        'metadata': {
            'total_categories': 7,
            'categories': [
                'RESIDENTIAL', 'MULTI_FAMILY', 'COMMERCIAL', 'INDUSTRIAL', 'HOTEL', 'MIXED_USE', 'LAND'
            ],
            'regions_analyzed': [],
        },
    }

    total_properties = 0

    # Process NOLA region
    print("Processing NOLA (Orleans & Jefferson)...")
    nola_listings = load_listings('nola')
    if nola_listings:
        print(f"  Loaded {len(nola_listings)} listings")
        zip_stats_nola = aggregate_by_zip(nola_listings)
        print(f"  Aggregated into {len(zip_stats_nola)} ZIP codes")

        heatmaps_nola = generate_category_heatmaps(zip_stats_nola)
        clusters_nola = kmeans_clustering(nola_listings, k=12)
        insights_nola = generate_cluster_insights(clusters_nola)
        summary_nola = generate_category_summary(zip_stats_nola)

        analysis['regions']['nola'] = {
            'total_properties': len(nola_listings),
            'total_zips': len(zip_stats_nola),
            'heatmaps': heatmaps_nola,
            'clusters': insights_nola,
            'summary': summary_nola,
        }

        total_properties += len(nola_listings)
        analysis['metadata']['regions_analyzed'].append('nola')
        print(f"  Generated {len(heatmaps_nola)} category heatmaps")
        print(f"  Generated {len(insights_nola)} investment clusters")
    else:
        print("  No NOLA listings loaded (pool file missing or empty)")

    print()

    # Process Baton Rouge (East Baton Rouge Parish) region
    print("Processing Baton Rouge (East Baton Rouge)...")
    br_listings = load_listings('launi')
    if br_listings:
        print(f"  Loaded {len(br_listings)} listings")
        zip_stats_br = aggregate_by_zip(br_listings)
        print(f"  Aggregated into {len(zip_stats_br)} ZIP codes")

        heatmaps_br = generate_category_heatmaps(zip_stats_br)
        clusters_br = kmeans_clustering(br_listings, k=8)
        insights_br = generate_cluster_insights(clusters_br)
        summary_br = generate_category_summary(zip_stats_br)

        analysis['regions']['baton_rouge'] = {
            'total_properties': len(br_listings),
            'total_zips': len(zip_stats_br),
            'heatmaps': heatmaps_br,
            'clusters': insights_br,
            'summary': summary_br,
        }

        total_properties += len(br_listings)
        analysis['metadata']['regions_analyzed'].append('baton_rouge')
        print(f"  Generated {len(heatmaps_br)} category heatmaps")
        print(f"  Generated {len(insights_br)} investment clusters")
    else:
        print("  No Baton Rouge listings loaded (pool file missing or empty)")

    print()

    # Update metadata
    analysis['metadata']['total_properties'] = total_properties

    # Write output
    json.dump(analysis, open(R + 'analysis_categories.json', 'w'), indent=2)
    print("=" * 70)
    print(f"Analysis complete: {total_properties} properties across {len(analysis['metadata']['regions_analyzed'])} regions")
    print(f"Output: analysis_categories.json ({len(json.dumps(analysis))} bytes)")
    print("=" * 70)


if __name__ == '__main__':
    main()
