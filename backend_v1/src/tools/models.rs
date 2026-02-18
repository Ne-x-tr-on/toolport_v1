use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, PartialEq)]
#[sqlx(type_name = "tool_category", rename_all = "PascalCase")]
pub enum ToolCategory {
    #[serde(rename = "Hand Tool")]
    #[sqlx(rename = "Hand Tool")]
    HandTool,
    #[serde(rename = "Electrical Tool")]
    #[sqlx(rename = "Electrical Tool")]
    ElectricalTool,
    #[serde(rename = "Electronic Component")]
    #[sqlx(rename = "Electronic Component")]
    ElectronicComponent,
    Mechatronics,
    Consumable,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, PartialEq)]
#[sqlx(type_name = "tool_status", rename_all = "PascalCase")]
pub enum ToolStatus {
    Available,
    #[serde(rename = "Partially Issued")]
    #[sqlx(rename = "Partially Issued")]
    PartiallyIssued,
    #[serde(rename = "Low Stock")]
    #[sqlx(rename = "Low Stock")]
    LowStock,
    #[serde(rename = "Out of Stock")]
    #[sqlx(rename = "Out of Stock")]
    OutOfStock,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Tool {
    pub id:                   i32,
    pub name:                 String,
    pub category:             ToolCategory,
    pub subcategory:          Option<String>,
    pub quantity:             i32,
    pub issued_qty:           i32,
    pub unit:                 String,
    pub lab_id:               Option<i32>,
    pub lab_name:             Option<String>,
    pub description:          Option<String>,
    pub is_consumable:        bool,
    pub consumable_type:      Option<String>,
    pub low_stock_threshold:  i32,
    pub status:               ToolStatus,
    pub date_added:           NaiveDate,
    pub created_at:           DateTime<Utc>,
    pub updated_at:           DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateToolRequest {
    pub name:                 String,
    pub category:             ToolCategory,
    pub subcategory:          Option<String>,
    pub quantity:             i32,
    pub unit:                 Option<String>,
    pub lab_id:               Option<i32>,
    pub description:          Option<String>,
    pub is_consumable:        Option<bool>,
    pub consumable_type:      Option<String>,
    pub low_stock_threshold:  Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateToolRequest {
    pub name:                 Option<String>,
    pub category:             Option<ToolCategory>,
    pub subcategory:          Option<String>,
    pub quantity:             Option<i32>,
    pub unit:                 Option<String>,
    pub lab_id:               Option<i32>,
    pub description:          Option<String>,
    pub is_consumable:        Option<bool>,
    pub consumable_type:      Option<String>,
    pub low_stock_threshold:  Option<i32>,
}

#[derive(Debug, Deserialize, Default)]
#[allow(dead_code)]
pub struct ToolFilters {
    pub category:    Option<String>,
    pub subcategory: Option<String>,
    pub lab:         Option<String>,
    pub status:      Option<String>,
    pub search:      Option<String>,
    pub sort:        Option<String>,
    pub order:       Option<String>,
}
