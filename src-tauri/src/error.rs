use serde::Serialize;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum PortoError {
    #[error("Docker API error: {0}")]
    Docker(#[from] bollard::errors::Error),

    #[error("System error: {0}")]
    System(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Invalid argument: {0}")]
    InvalidArgument(String),
}

impl Serialize for PortoError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

pub type PortoResult<T> = Result<T, PortoError>;
